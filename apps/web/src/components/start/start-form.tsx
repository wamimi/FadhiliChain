"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useConfig } from "wagmi";
import { readContract, signTypedData } from "@wagmi/core";
import { isAddress, getAddress, type Address } from "viem";
import { toast } from "sonner";
import { Check, ImagePlus, Loader2, Lock } from "lucide-react";
import { campaignFactoryAbi } from "@fadhili/contracts/abi";
import { useSession } from "../providers";
import { useApi } from "@/lib/api";
import { CATEGORIES, SITE } from "@/lib/site";
import type { TokenInfo } from "@/lib/chains";
import { formatMoney, toUnits, currencyPrefix } from "@/lib/money";
import { storyHash, type CampaignStory } from "@/lib/metadata";
import { CAMPAIGN_REQUEST_TYPES, factoryDomain, requestToJson, REQUEST_VALIDITY_SECONDS, type CampaignRequest } from "@/lib/eip712";
import { ensureChain, friendlyError } from "@/lib/tx";
import { dateFmt } from "@/lib/time";

type Network = { chainId: number; name: string; label: string; live: boolean; factory: Address | null; tokens: TokenInfo[] };

const STEPS = ["Your story", "Goal and payout", "Review and submit"] as const;
const DAY = 86_400;

function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.trim().length;
  return (
    <span className={`tabular ${n > max || (n > 0 && n < min) ? "text-danger" : ""}`}>
      {n}/{max}
    </span>
  );
}

export function StartForm({ networks, preview }: { networks: Network[]; preview: boolean }) {
  const session = useSession();
  const config = useConfig();
  const api = useApi();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [story, setStory] = useState<CampaignStory>({
    title: "",
    summary: "",
    story: "",
    category: "medical",
    location: "",
    beneficiary: "",
    organiserName: "",
    imageUrl: null,
  });
  const set = <K extends keyof CampaignStory>(k: K, v: CampaignStory[K]) => setStory((s) => ({ ...s, [k]: v }));

  const usable = networks.filter((n) => n.live || preview);
  const [chainId, setChainId] = useState(usable[0]?.chainId ?? networks[0].chainId);
  const network = networks.find((n) => n.chainId === chainId)!;
  const [tokenAddr, setTokenAddr] = useState<Address>(network.tokens[0].address);
  const token = network.tokens.find((t) => t.address === tokenAddr) ?? network.tokens[0];
  const [target, setTarget] = useState("");
  const [days, setDays] = useState(30);
  const [payout, setPayout] = useState<"me" | "other">("me");
  const [otherWallet, setOtherWallet] = useState("");
  const [contact, setContact] = useState("");
  const [documentsNote, setDocumentsNote] = useState("");
  const [agree, setAgree] = useState(false);

  const deadlineDate = useMemo(() => new Date(Date.now() + days * DAY * 1000), [days]);
  let targetUnits = 0n;
  try {
    targetUnits = toUnits(target, token);
  } catch {
    targetUnits = 0n;
  }
  const recipient = payout === "me" ? session.address : isAddress(otherWallet) ? getAddress(otherWallet) : undefined;
  const fee = (targetUnits * BigInt(SITE.feePercent * 100)) / 10000n;

  const storyErrors = [
    story.title.trim().length < 8 && "a title of at least 8 characters",
    story.summary.trim().length < 20 && "a one-line summary",
    story.story.trim().length < 100 && "the full story (at least 100 characters)",
    story.location.trim().length < 2 && "a location",
    story.beneficiary.trim().length < 2 && "who the money is for",
    story.organiserName.trim().length < 2 && "your name",
  ].filter(Boolean) as string[];
  const moneyErrors = [
    targetUnits <= 0n && "a target",
    !recipient && (payout === "me" ? "log in so we know where to send the funds" : "a valid account ID for the receiving institution"),
    contact.trim().length < 5 && "a phone number or email for the reviewer",
  ].filter(Boolean) as string[];

  async function upload(file: File) {
    if (!session.authenticated) return session.login();
    const form = new FormData();
    form.append("file", file);
    setBusy("Uploading photo");
    try {
      const { url } = await api<{ url: string }>("/api/upload", { method: "POST", body: form });
      set("imageUrl", url);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    if (preview || !network.factory) {
      toast("Fundraiser submissions open soon", { description: "We're finishing setup. Your details stay on this page." });
      return;
    }
    if (!session.authenticated) return session.login();
    if (!recipient || !session.address) return;
    try {
      setBusy("Preparing your terms");
      const organiser = await ensureChain(config, chainId);
      const nonce = await readContract(config, {
        chainId,
        address: network.factory,
        abi: campaignFactoryAbi,
        functionName: "nonces",
        args: [organiser],
      });
      const now = Math.floor(Date.now() / 1000);
      const request: CampaignRequest = {
        token: token.address,
        organiser,
        recipient,
        target: targetUnits,
        deadline: BigInt(Math.floor(deadlineDate.getTime() / 1000)),
        metadataHash: storyHash(story),
        nonce,
        expiry: BigInt(now + REQUEST_VALIDITY_SECONDS),
      };
      setBusy("Locking your terms");
      const signature = await signTypedData(config, {
        domain: factoryDomain(chainId, network.factory),
        types: CAMPAIGN_REQUEST_TYPES,
        primaryType: "CampaignRequest",
        message: request,
      });
      setBusy("Sending for review");
      const { id } = await api<{ id: string }>("/api/campaigns", {
        method: "POST",
        json: { chainId, story, contact, documentsNote: documentsNote || undefined, request: requestToJson(request), signature },
      });
      setDone(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  if (done) {
    return (
      <div className="max-w-3xl rounded-[32px] bg-moss p-8 text-cream sm:p-12">
        <span className="grid size-14 place-items-center rounded-full bg-lime text-ink">
          <Check size={28} strokeWidth={3} />
        </span>
        <h2 className="mt-6 text-[clamp(1.8rem,4vw,2.8rem)] leading-tight font-black tracking-tight">Sent for review</h2>
        <p className="mt-4 max-w-[52ch] text-lg text-cream/85">
          A reviewer will contact you on <b className="text-cream">{contact}</b> to confirm a few details, usually within two days. Once approved, your campaign goes live with exactly the terms you signed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/me" className="pill pill-lime">
            Go to your dashboard
          </Link>
          <Link href="/legal/campaign-rules" className="pill pill-ghost-light">
            Read the fundraiser rules
          </Link>
        </div>
      </div>
    );
  }

  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] lg:gap-14">
      <div className="min-w-0">
        <ol className="mb-8 flex flex-wrap gap-2" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                  i === step ? "bg-ink text-cream" : i < step ? "bg-lime text-ink" : "bg-sand text-muted"
                }`}
              >
                <span className="tabular">{i + 1}</span> {s}
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-7">
            <Field label="Title" htmlFor="title" hint={<Counter value={story.title} min={8} max={90} />}>
              <input id="title" className="field" maxLength={90} value={story.title} onChange={(e) => set("title", e.target.value)} placeholder="Achieng's kidney transplant at KNH" />
            </Field>
            <Field label="One-line summary" htmlFor="summary" hint={<>Shown on fundraiser cards and link previews. <Counter value={story.summary} min={20} max={200} /></>}>
              <input id="summary" className="field" maxLength={200} value={story.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Achieng needs a transplant. Her brother is a match; the family needs help with the deposit." />
            </Field>
            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Category" htmlFor="category">
                <select id="category" className="field" value={story.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location" htmlFor="location">
                <input id="location" className="field" maxLength={80} value={story.location} onChange={(e) => set("location", e.target.value)} placeholder="Kenyatta National Hospital, Nairobi" />
              </Field>
              <Field label="Who the money is for" htmlFor="beneficiary">
                <input id="beneficiary" className="field" maxLength={80} value={story.beneficiary} onChange={(e) => set("beneficiary", e.target.value)} placeholder="Achieng Atieno" />
              </Field>
              <Field label="Your name, as donors will see it" htmlFor="organiser">
                <input id="organiser" className="field" maxLength={80} value={story.organiserName} onChange={(e) => set("organiserName", e.target.value)} placeholder="Grace Atieno" />
              </Field>
            </div>
            <Field
              label="The full story"
              htmlFor="story"
              hint={<>What happened, what the money pays for, and how you'll show it was spent. Leave a blank line between paragraphs. <Counter value={story.story} min={100} max={8000} /></>}
            >
              <textarea id="story" className="field min-h-64 leading-relaxed" maxLength={8000} value={story.story} onChange={(e) => set("story", e.target.value)} />
            </Field>
            <div>
              <span className="label">Photo (optional)</span>
              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-ink/20 bg-paper p-5 hover:border-ink/50">
                {story.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.imageUrl} alt="" className="size-20 rounded-xl object-cover" />
                ) : (
                  <span className="grid size-20 place-items-center rounded-xl bg-sand">
                    <ImagePlus size={26} />
                  </span>
                )}
                <span>
                  <b>{story.imageUrl ? "Change photo" : "Add a photo"}</b>
                  <span className="block text-sm text-muted">JPG, PNG or WebP, up to 4 MB. Campaigns with a real photo raise more.</span>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
            <StepFooter errors={storyErrors} onNext={next} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-7">
            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Where your donors are" htmlFor="network" hint="Choose global if you expect most donations in digital dollars.">
                <select
                  id="network"
                  className="field"
                  value={chainId}
                  onChange={(e) => {
                    const n = networks.find((x) => x.chainId === Number(e.target.value))!;
                    setChainId(n.chainId);
                    setTokenAddr(n.tokens[0].address);
                  }}
                >
                  {networks.map((n) => (
                    <option key={n.chainId} value={n.chainId} disabled={!n.live && !preview}>
                      {n.label}
                      {!n.live && !preview ? " (coming soon)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Currency donors give in" htmlFor="token">
                <select id="token" className="field" value={token.address} onChange={(e) => setTokenAddr(e.target.value as Address)}>
                  {network.tokens.map((t) => (
                    <option key={t.address} value={t.address}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Goal" htmlFor="target" hint="Miss it by the deadline and every donor is refunded.">
                <div className="flex items-center rounded-[14px] border-[1.5px] border-ink/12 bg-paper focus-within:border-moss">
                  <span className="pl-4 font-semibold text-muted">{currencyPrefix(token)}</span>
                  <input
                    id="target"
                    inputMode="decimal"
                    className="tabular min-h-12 w-full bg-transparent px-3 text-lg outline-none"
                    value={target}
                    onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ""))}
                    placeholder={token.currency === "KES" ? "50,000" : "1,000"}
                  />
                </div>
              </Field>
              <Field label="Deadline" htmlFor="days" hint={`Closes ${dateFmt.format(deadlineDate)}`}>
                <select id="days" className="field" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[7, 14, 21, 30, 45, 60, 90].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <fieldset>
              <legend className="label">Where the funds go when you hit your goal</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["me", "To my account", "Withdraw from your dashboard when you hit your goal."],
                    ["other", "Directly to an institution", "For a hospital, school or committee with its own FadhiliChain account."],
                  ] as const
                ).map(([v, t, d]) => (
                  <label key={v} className={`cursor-pointer rounded-2xl border-[1.5px] p-4 ${payout === v ? "border-moss bg-lime/25" : "border-ink/12 bg-paper"}`}>
                    <input type="radio" name="payout" value={v} checked={payout === v} onChange={() => setPayout(v)} className="sr-only" />
                    <b>{t}</b>
                    <span className="mt-1 block text-sm text-muted">{d}</span>
                  </label>
                ))}
              </div>
              {payout === "other" && (
                <input
                  className="field tabular mt-3"
                  value={otherWallet}
                  onChange={(e) => setOtherWallet(e.target.value.trim())}
                  placeholder="0x…"
                  aria-label="Institution account ID"
                  spellCheck={false}
                />
              )}
              <p className="hint flex items-center gap-1.5">
                <Lock size={14} /> This can&apos;t be changed after you submit, by you or by us.
              </p>
            </fieldset>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Phone or email for the reviewer" htmlFor="contact" hint="Private. Only the reviewer sees it.">
                <input id="contact" className="field" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="0712 345 678" />
              </Field>
              <Field label="What can you show the reviewer? (optional)" htmlFor="docs" hint="A hospital estimate, admission letter, quote, death notice…">
                <input id="docs" className="field" maxLength={600} value={documentsNote} onChange={(e) => setDocumentsNote(e.target.value)} />
              </Field>
            </div>
            <StepFooter errors={moneyErrors} onNext={next} onBack={() => setStep(0)} />
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="overflow-hidden rounded-[28px] bg-paper ring-1 ring-ink/8">
              <div className="flex items-center gap-2 bg-ink px-6 py-4 font-semibold text-cream">
                <Lock size={16} /> These terms are locked when you submit
              </div>
              <dl className="divide-y divide-ink/8">
                {[
                  ["Fundraiser", story.title],
                  ["Goal", formatMoney(targetUnits, token)],
                  ["Deadline", dateFmt.format(deadlineDate)],
                  ["Funds go to", payout === "me" ? "Your FadhiliChain account" : recipient],
                  ["If you hit your goal", `Funds released, minus a ${SITE.feePercent}% fee (${formatMoney(fee, token)} at your goal)`],
                  ["If you don't", "Every donor is refunded in full. No fee."],
                  ["Currency", token.label],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-6 py-4 sm:grid-cols-[200px_1fr]">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="tabular break-words text-ink/85">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <label className="mt-6 flex items-start gap-3">
              <input type="checkbox" className="mt-1 size-5 accent-moss" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                The story is true, the money will be used as described, and I agree to the{" "}
                <Link href="/legal/campaign-rules" className="font-semibold underline" target="_blank">
                  fundraiser rules
                </Link>{" "}
                and{" "}
                <Link href="/legal/terms" className="font-semibold underline" target="_blank">
                  terms
                </Link>
                .
              </span>
            </label>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="pill pill-ghost" onClick={() => setStep(1)} disabled={Boolean(busy)}>
                Back
              </button>
              <button type="button" className="pill pill-ink" onClick={submit} disabled={!agree || Boolean(busy)}>
                {busy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> {busy}
                  </>
                ) : session.authenticated || preview ? (
                  "Submit for review"
                ) : (
                  "Log in to submit"
                )}
              </button>
            </div>
            <p className="hint mt-4 max-w-[60ch]">
              Submitting is free. Your terms are sealed with your digital signature, so reviewers can approve them but never change them.
            </p>
          </div>
        )}
        {busy && step < 2 && <p className="hint mt-4 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {busy}</p>}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-[28px] bg-moss p-7 text-cream">
          <h2 className="text-xl font-extrabold">What happens next</h2>
          <ol className="mt-5 space-y-4 text-cream/85">
            {[
              "A reviewer contacts you to confirm who you are and what the funds are for.",
              "Once approved, your fundraiser goes live with its own secure account.",
              "Share your link. Every donation shows up in real time.",
              "At the deadline: hit your goal and withdraw in one tap. Miss it and every donor is refunded.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="tabular font-black text-lime">{String(i + 1).padStart(2, "0")}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-[28px] bg-sand p-6">
          <p className="font-extrabold">Fees</p>
          <p className="mt-1 text-sm text-muted">
            {SITE.feePercent}% of the total, taken only when you hit your goal. Nothing if you don&apos;t.{" "}
            <Link href="/fees" className="font-semibold text-ink underline">
              Compare fees
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}

function StepFooter({ errors, onNext, onBack }: { errors: string[]; onNext: () => void; onBack?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {onBack && (
        <button type="button" className="pill pill-ghost" onClick={onBack}>
          Back
        </button>
      )}
      <button type="button" className="pill pill-ink" onClick={onNext} disabled={errors.length > 0}>
        Continue
      </button>
      {errors.length > 0 && <p className="text-sm text-muted">Still needed: {errors.join(", ")}.</p>}
    </div>
  );
}

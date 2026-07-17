import { useDocumentMetadata } from "@/hooks/use-document-metadata";

interface DocumentDateProps {
  filePath: string;
}

export function DocumentDate({ filePath }: DocumentDateProps) {
  const { updatedLabel, createdLabel } = useDocumentMetadata(filePath);

  if (!updatedLabel && !createdLabel) return null;

  const parts: string[] = [];
  if (updatedLabel) parts.push(`Updated ${updatedLabel}`);
  if (createdLabel) parts.push(`Created ${createdLabel}`);

  return (
    <div className="pb-6 text-[13px] leading-[1.15] text-[var(--text-muted)]">
      {parts.join(" · ")}
    </div>
  );
}

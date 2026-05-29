import {
  AtSign,
  Briefcase,
  FileText,
  FolderGit2,
  Globe,
  Mail,
  PenLine,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import type { SocialKind, SourceKind } from "@/lib/types";

// lucide-react v1 dropped brand glyphs (Linkedin/Github/Twitter), so we map to
// neutral icons. Labels always accompany them, so meaning stays clear.

export const SOURCE_ICON: Record<SourceKind, LucideIcon> = {
  linkedin: Briefcase,
  resume: FileText,
  website: Globe,
  manual: PenLine,
};

export const SOCIAL_ICON: Record<SocialKind, LucideIcon> = {
  linkedin: Briefcase,
  github: FolderGit2,
  x: AtSign,
  website: Globe,
  email: Mail,
  other: LinkIcon,
};

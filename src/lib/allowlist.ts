export const ALLOWLIST_EMAILS = [
  "shayana.btech22@rvu.edu.in",
  "sudhanvams.btech22@rvu.edu.in",
  "mukthak.btech22@rvu.edu.in",
  "rachanams.bsc22@rvu.edu.in",
  "sanjand.btech22@rvu.edu.in",
  "shashankrp.bsc22@rvu.edu.in",
  "uzairs.btech22@rvu.edu.in",
  "sushanr.btech22@rvu.edu.in",
  "aneeshk.btech22@rvu.edu.in",
  "sangameshry.btech22@rvu.edu.in",
  "anil.btech22@rvu.edu.in",
  "binuppb.bsc22@rvu.edu.in",
  "greeshmab.btech22@rvu.edu.in",
  "Prathamk.btech22@rvu.edu.in",
  "puneethashivashankar@gmail.com",
];
export function isEmailInAllowlist(email: string | null | undefined): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase().trim();
  return ALLOWLIST_EMAILS.some((allowed) => allowed.toLowerCase().trim() === lowerEmail);
}

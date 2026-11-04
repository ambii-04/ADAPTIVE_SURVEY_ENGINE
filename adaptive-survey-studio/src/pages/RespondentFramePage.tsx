import { useParams } from 'react-router-dom';

/**
 * The public survey link shows the gamified respondent experience. It runs as its own document
 * (respondent.html), so its global styles stay separate from the studio's.
 */
export function RespondentFramePage() {
  const { researchId } = useParams<{ researchId: string }>();

  if (!researchId) {
    return null;
  }

  return (
    <iframe
      title="Survey"
      src={`/respondent.html?research=${encodeURIComponent(researchId)}`}
      className="fixed inset-0 w-full h-full border-0"
      allow="autoplay"
    />
  );
}

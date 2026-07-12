import { useEffect } from 'react';

interface StatusHeadingProps {
  title: string;
}

export function StatusHeading({
  title,
}: StatusHeadingProps): React.JSX.Element {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return <h1>{title}</h1>;
}

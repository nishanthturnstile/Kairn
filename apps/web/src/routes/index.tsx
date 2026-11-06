import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <section>
      <p className="eyebrow">Local development</p>
      <h1>A place for the journey.</h1>
      <p>
        The application foundation is taking shape. This local workspace checks the connection
        between the web app and its service.
      </p>
      <a href="/setup/reader">Open the synthetic reader</a>
    </section>
  );
}

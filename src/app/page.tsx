import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ADDRESS = "1846 Broadway St, Eureka, CA 95501";
const PHONE_DISPLAY = "(707) 444-2288";
const PHONE_TEL = "+17074442288";
const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(
  "North Coast Roleplaying, " + ADDRESS
)}`;
const FACEBOOK_URL = "https://www.facebook.com/groups/107221222640776/";

const OFFERINGS = [
  "Comics & graphic novels",
  "Tabletop & board games",
  "RPG books & supplies",
  "Table space rental",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <span className="font-heading text-2xl tracking-wide text-primary">
          North Coast Roleplaying
        </span>
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline">
          Staff &amp; Customer Login
        </Button>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center gap-6 bg-secondary px-6 py-20 text-center text-secondary-foreground sm:px-10">
          <Badge className="bg-accent text-accent-foreground">
            Eureka, CA &middot; Est. 1991
          </Badge>
          <h1 className="font-heading max-w-2xl text-4xl leading-tight tracking-wide sm:text-6xl">
            Comics, Games &amp; RPGs on Broadway
          </h1>
          <p className="max-w-xl text-lg text-secondary-foreground/80">
            North Coast Roleplaying is Eureka&rsquo;s hub for tabletop
            enthusiasts and comic fans &mdash; open every day, noon to 4pm.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              render={<a href={MAPS_URL} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              size="lg"
            >
              Get Directions
            </Button>
            <Button
              render={<a href={`tel:${PHONE_TEL}`} />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="text-foreground"
            >
              Call {PHONE_DISPLAY}
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-16 sm:grid-cols-2 sm:px-10">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl tracking-wide">
                Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="text-foreground text-lg font-medium">
                Open 7 days a week
              </p>
              <p>Noon &ndash; 4:00pm, daily</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl tracking-wide">
                Visit Us
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="text-foreground">{ADDRESS}</p>
              <p>{PHONE_DISPLAY}</p>
            </CardContent>
          </Card>
        </section>

        <Separator className="mx-auto max-w-5xl" />

        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10">
          <h2 className="font-heading mb-8 text-center text-3xl tracking-wide">
            What We Sell
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERINGS.map((item) => (
              <Card key={item}>
                <CardContent className="pt-6 text-center font-medium">
                  {item}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted px-6 py-16 sm:px-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h2 className="font-heading text-3xl tracking-wide">
              Join the Community
            </h2>
            <p className="text-muted-foreground max-w-xl">
              North Coast Roleplaying is affiliated with a monthly
              role-playing event held the last Thursday of every month in
              McKinleyville. Follow our Facebook group for updates on events,
              new arrivals, and store news.
            </p>
            <Button
              render={<a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              variant="secondary"
            >
              Visit our Facebook Group
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground sm:px-10">
        <p>North Coast Roleplaying &middot; {ADDRESS} &middot; {PHONE_DISPLAY}</p>
      </footer>
    </div>
  );
}

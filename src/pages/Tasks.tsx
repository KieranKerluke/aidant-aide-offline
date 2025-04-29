
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Tasks() {
  return (
    <Layout title="Tasks">
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The Tasks module will be implemented in the next version.</p>
        </CardContent>
      </Card>
    </Layout>
  );
}

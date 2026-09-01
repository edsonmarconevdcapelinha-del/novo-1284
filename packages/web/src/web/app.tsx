import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Abastecer from "./pages/abastecer";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/abastecer" component={Abastecer} />
        <Route>
          <div className="flex min-h-dvh items-center justify-center bg-background">
            <p className="font-mono text-sm text-muted-foreground">
              Página não encontrada — volte para <a href="/" className="text-signal underline">bipar</a>.
            </p>
          </div>
        </Route>
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;

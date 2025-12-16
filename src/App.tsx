import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { setApiKey } from "@/service/enso";
import Providers from "@/Providers";
import Home from "@/components/Home";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Provider } from "@/components/ui/provider";

import logoUrl from "./accountable_logo.png";

function App() {
  useEffect(() => {
    setApiKey(import.meta.env.VITE_ENSO_API_KEY);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Provider defaultTheme="dark" forcedTheme="dark">
        <Providers>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "10px",
            }}
          >
            <img src={logoUrl} alt={"Accountable"} style={{ height: "50px" }} />

            <div
              style={{
                display: "flex",
                gap: "5px",
                alignItems: "center",
              }}
            >
              <ConnectButton />
            </div>
          </div>
          <Home />
        </Providers>
      </Provider>
    </div>
  );
}

export default App;

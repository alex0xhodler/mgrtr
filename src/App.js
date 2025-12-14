import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx("div", { style: { width: "100%", height: "100%" }, children: _jsx(Provider, { defaultTheme: "dark", children: _jsxs(Providers, { children: [_jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-around",
                            padding: "10px",
                        }, children: [_jsx("img", { src: logoUrl, alt: "Accountable", style: { height: "50px" } }), _jsxs("div", { style: {
                                    display: "flex",
                                    gap: "5px",
                                    alignItems: "center",
                                }, children: [_jsx(ColorModeButton, {}), _jsx(ConnectButton, {})] })] }), _jsx(Home, {})] }) }) }));
}
export default App;

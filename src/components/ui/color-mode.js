"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react";
import { ThemeProvider, useTheme } from "next-themes";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";
export function ColorModeProvider(props) {
    return (_jsx(ThemeProvider, { attribute: "class", disableTransitionOnChange: true, ...props }));
}
export function useColorMode() {
    const { resolvedTheme, setTheme } = useTheme();
    const toggleColorMode = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };
    return {
        colorMode: resolvedTheme,
        setColorMode: setTheme,
        toggleColorMode,
    };
}
export function useColorModeValue(light, dark) {
    const { colorMode } = useColorMode();
    return colorMode === "dark" ? dark : light;
}
export function ColorModeIcon() {
    const { colorMode } = useColorMode();
    return colorMode === "dark" ? _jsx(LuMoon, {}) : _jsx(LuSun, {});
}
export const ColorModeButton = React.forwardRef(function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode();
    return (_jsx(ClientOnly, { fallback: _jsx(Skeleton, { boxSize: "8" }), children: _jsx(IconButton, { onClick: toggleColorMode, variant: "ghost", "aria-label": "Toggle color mode", size: "sm", ref: ref, ...props, css: {
                _icon: {
                    width: "5",
                    height: "5",
                },
            }, children: _jsx(ColorModeIcon, {}) }) }));
});
export const LightMode = React.forwardRef(function LightMode(props, ref) {
    return (_jsx(Span, { color: "fg", display: "contents", className: "chakra-theme light", colorPalette: "gray", colorScheme: "light", ref: ref, ...props }));
});
export const DarkMode = React.forwardRef(function DarkMode(props, ref) {
    return (_jsx(Span, { color: "fg", display: "contents", className: "chakra-theme dark", colorPalette: "gray", colorScheme: "dark", ref: ref, ...props }));
});

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog as ChakraDialog, Portal } from "@chakra-ui/react";
import { CloseButton } from "./close-button";
import * as React from "react";
export const DialogContent = React.forwardRef(function DialogContent(props, ref) {
    const { children, portalled = true, portalRef, backdrop = true, ...rest } = props;
    return (_jsxs(Portal, { disabled: !portalled, container: portalRef, children: [backdrop && _jsx(ChakraDialog.Backdrop, {}), _jsx(ChakraDialog.Positioner, { children: _jsx(ChakraDialog.Content, { ref: ref, ...rest, asChild: false, children: children }) })] }));
});
export const DialogCloseTrigger = React.forwardRef(function DialogCloseTrigger(props, ref) {
    return (_jsx(ChakraDialog.CloseTrigger, { position: "absolute", top: "2", insetEnd: "2", ...props, asChild: true, children: _jsx(CloseButton, { size: "sm", ref: ref, children: props.children }) }));
});
export const DialogRoot = ChakraDialog.Root;
export const DialogFooter = ChakraDialog.Footer;
export const DialogHeader = ChakraDialog.Header;
export const DialogBody = ChakraDialog.Body;
export const DialogBackdrop = ChakraDialog.Backdrop;
export const DialogTitle = ChakraDialog.Title;
export const DialogDescription = ChakraDialog.Description;
export const DialogTrigger = ChakraDialog.Trigger;
export const DialogActionTrigger = ChakraDialog.ActionTrigger;

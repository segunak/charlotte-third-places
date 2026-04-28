# Modal Context Design

`ModalContext` is the app-wide system for opening and closing overlay experiences such as place details, photo galleries, and place-scoped AI chat. It matters most on mobile and in the installed PWA, where the browser or OS Back action may be the user's primary way out of a nested flow.

## Core Idea

The modal system is modeled as a stack of surfaces. A surface is one overlay layer tied to a place. Opening a place, photo gallery, or chat pushes a new surface onto the stack. Closing uses last-in, first-out behavior: the top surface closes first, revealing the surface underneath it.

This stack model lets the app support flows like:

- Place details -> photos
- Place details -> Ask AI
- Ask AI -> place link from an AI response

Each flow stays in the app instead of forcing a full page navigation or losing the current chat state.

## Browser History

Browser history is part of the modal system, not an afterthought. When a surface opens, the app writes enough modal state into the current browser history flow for Back and Forward to understand what was open.

That design gives the PWA a natural escape path:

- Back closes the current modal surface.
- Forward can restore a surface that Back just closed.
- Closing multiple surfaces moves through history instead of bypassing it.

Modal state updates are intentionally immediate. They are not deferred with React transitions because the visible stack and browser history need to stay synchronized. If one updates later than the other, Back and Forward can briefly disagree with what React is rendering.

## Actions, Not Shared State

Most components only need to trigger modals; they do not need to read modal state. `ModalContext` exposes stable actions for opening and closing surfaces while keeping the stack state inside the provider.

This keeps components such as cards, maps, and buttons from re-rendering just because a modal elsewhere opened or closed. The provider owns the stack, renders the active surfaces, and passes each surface the information it needs.

## Chat-Origin Place Links

AI responses can contain links to place pages. The chat UI intercepts internal place links and opens them as place surfaces instead of navigating away. This preserves the chat session and keeps the user inside the current modal/page flow.

Places opened from chat are marked as chat-origin. That signal hides the Ask AI button for that nested place view, which prevents loops like Chat -> Place -> Ask AI -> Chat. Normal place opens from cards, maps, and place pages can still show Ask AI.

## Design Rules To Preserve

- Treat the surface stack as the source of truth for rendered overlays.
- Keep browser history and the visible stack in sync.
- Do not put browser history writes inside React state updater functions.
- Keep modal actions stable so action-only consumers avoid unnecessary re-renders.
- Preserve chat sessions when AI links point to places in this app.
- Avoid opening a second chat from a place that was reached through chat.

These rules are more important than the exact function names or component boundaries. If the implementation changes, keep the same user-facing behavior: nested modal flows should be reversible with Back/Forward, and chat-driven place discovery should not strand the user.

/**
 * Zanderio Widget — Toast Notification
 *
 * Renders a transient cart toast at the bottom of the widget.
 * Shown for 3 seconds after `addToCart` via the `useCart` hook.
 * Displays a shopping-cart icon alongside the provided message.
 * Returns `null` when `show` is false so it produces no DOM.
 *
 * @param {{ message: string, show: boolean }} props
 *
 * @module components/toast/toast
 */

import { IoCart } from "react-icons/io5";

export default function Toast({ message, show }) {
  if (!show) return null;

  return (
    <div className="cart-toast">
      <IoCart size={18} />
      <span>{message}</span>
    </div>
  );
}

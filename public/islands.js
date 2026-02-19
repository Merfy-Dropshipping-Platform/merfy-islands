/**
 * <merfy-island> Web Component
 *
 * Usage:
 *   <merfy-island component="PopularProducts" hash="a1b2c3d4">
 *     <div slot="content">...build-time HTML...</div>
 *   </merfy-island>
 *
 * Checks /_islands/manifest.json for freshness.
 * If the hash matches build-time hash -> keeps existing content (zero requests).
 * If hash differs -> fetches /_islands/{component}.html and replaces content.
 * On any error -> silently keeps build-time content.
 */
class MerfyIsland extends HTMLElement {
  connectedCallback() {
    const component = this.getAttribute("component");
    const buildHash = this.getAttribute("hash");

    if (!component) return;

    this._revalidate(component, buildHash).catch(() => {
      // Silently keep build-time content on any error
    });
  }

  async _revalidate(component, buildHash) {
    let manifest;
    try {
      const res = await fetch("/_islands/manifest.json");
      if (!res.ok) return;
      manifest = await res.json();
    } catch {
      return; // Network error - keep build-time content
    }

    const entry =
      manifest && manifest.fragments && manifest.fragments[component];
    if (!entry) return; // No entry in manifest - keep build-time content

    // If hashes match, data is current - do nothing
    if (buildHash && entry.hash === buildHash) return;

    // Hash differs - fetch fresh fragment
    let html;
    try {
      const res = await fetch(
        "/_islands/" + encodeURIComponent(component) + ".html",
      );
      if (!res.ok) return;
      html = await res.text();
    } catch {
      return; // Network error - keep build-time content
    }

    // Replace content in the slot
    const slot = this.querySelector("[slot=content]");
    if (slot) {
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      slot.replaceChildren(tpl.content.cloneNode(true));
    }
  }
}

if (!customElements.get("merfy-island")) {
  customElements.define("merfy-island", MerfyIsland);
}

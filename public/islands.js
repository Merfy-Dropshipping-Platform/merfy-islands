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
 * If manifest missing AND hash="initial" -> fetches live from islands server.
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
    // Try to fetch manifest (cache-bust to always get latest)
    let manifest = null;
    try {
      const res = await fetch("/_islands/manifest.json?_=" + Date.now());
      if (res.ok) {
        manifest = await res.json();
      }
    } catch {
      // Network error — manifest unavailable
    }

    if (manifest) {
      const entry = manifest.fragments && manifest.fragments[component];
      if (!entry) return; // No entry in manifest — keep build-time content

      // If hashes match, data is current — do nothing
      if (buildHash && buildHash !== "initial" && entry.hash === buildHash) return;

      // Hash differs or initial — fetch fresh fragment (use hash for cache-busting)
      let html;
      try {
        const res = await fetch(
          "/_islands/" + encodeURIComponent(component) + ".html?v=" + (entry.hash || Date.now()),
        );
        if (!res.ok) return;
        html = await res.text();
      } catch {
        return;
      }

      this._replaceContent(html);
      return;
    }

    // No manifest available — if hash is "initial" (skeleton content),
    // fetch live from islands server to avoid showing skeleton forever
    if (buildHash === "initial") {
      const serverUrl = document.querySelector('meta[name="merfy-islands-url"]');
      const storeId = document.querySelector('meta[name="merfy-store-id"]');
      if (!serverUrl || !storeId) return;

      try {
        const res = await fetch(
          serverUrl.content + "/islands/" + encodeURIComponent(component),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeId: storeId.content }),
          },
        );
        if (!res.ok) return;
        const html = await res.text();
        this._replaceContent(html);
      } catch {
        return; // Keep skeleton on error
      }
    }
  }

  _replaceContent(html) {
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

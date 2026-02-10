export interface TOCConfig {
  contentId: string;
  indicatorId: string;
  maxLevel?: number;
  scrollOffset?: number;
}

export class TOCManager {
  private tocItems: HTMLElement[] = [];
  private observer: IntersectionObserver | null = null;
  private minDepth = 10;
  private maxLevel: number;
  private scrollTimeout: number | null = null;
  private contentId: string;
  private indicatorId: string;
  private scrollOffset: number;
  private clickHandlers = new Map<HTMLElement, EventListener>();

  constructor(config: TOCConfig) {
    this.contentId = config.contentId;
    this.indicatorId = config.indicatorId;
    this.maxLevel = config.maxLevel || 3;
    this.scrollOffset = config.scrollOffset || 80;
  }

  private getContentContainer(): Element | null {
    return (
      document.querySelector(".custom-md") ||
      document.querySelector(".prose") ||
      document.querySelector(".markdown-content")
    );
  }

  private getAllHeadings(): NodeListOf<HTMLElement> {
    const contentContainer = this.getContentContainer();
    if (contentContainer) {
      return contentContainer.querySelectorAll("h1, h2, h3, h4, h5, h6");
    }
    return document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  }

  private calculateMinDepth(headings: NodeListOf<HTMLElement>): number {
    let minDepth = 10;
    headings.forEach((heading) => {
      const depth = parseInt(heading.tagName.charAt(1), 10);
      minDepth = Math.min(minDepth, depth);
    });
    return minDepth;
  }

  private filterHeadings(headings: NodeListOf<HTMLElement>): HTMLElement[] {
    return Array.from(headings).filter((heading) => {
      const depth = parseInt(heading.tagName.charAt(1), 10);
      return depth < this.minDepth + this.maxLevel;
    });
  }

  private generateBadgeNode(depth: number, heading1Count: number): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className =
      "transition w-5 h-5 shrink-0 rounded-lg text-xs flex items-center justify-center font-bold";

    if (depth === this.minDepth) {
      wrapper.classList.add("bg-[var(--toc-badge-bg)]", "text-[var(--btn-content)]");
      wrapper.textContent = heading1Count.toString();
      return wrapper;
    }

    const dot = document.createElement("div");
    if (depth === this.minDepth + 1) {
      dot.className =
        "transition w-2 h-2 rounded-[0.1875rem] bg-[var(--toc-badge-bg)]";
    } else {
      dot.className =
        "transition w-1.5 h-1.5 rounded-sm bg-black/5 dark:bg-white/10";
    }
    wrapper.appendChild(dot);
    return wrapper;
  }

  private createEmptyStateNode(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "text-center py-8 text-gray-500 dark:text-gray-400";
    const paragraph = document.createElement("p");
    paragraph.textContent = "当前页面没有目录";
    wrapper.appendChild(paragraph);
    return wrapper;
  }

  private createTOCLinkNode(
    heading: HTMLElement,
    depth: number,
    heading1Count: number,
  ): HTMLAnchorElement {
    const link = document.createElement("a");
    const depthClass =
      depth === this.minDepth ? "" : depth === this.minDepth + 1 ? "pl-4" : "pl-8";
    link.setAttribute("href", `#${heading.id}`);
    link.setAttribute("data-heading-id", heading.id);
    link.className =
      "px-2 flex gap-2 relative transition w-full min-h-9 rounded-xl hover:bg-[var(--toc-btn-hover)] active:bg-[var(--toc-btn-active)] py-2 " +
      depthClass;

    const badge = this.generateBadgeNode(depth, heading1Count);
    link.appendChild(badge);

    const text = document.createElement("div");
    text.className =
      "transition text-sm flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap " +
      (depth <= this.minDepth + 1 ? "text-50" : "text-30");
    text.textContent = (heading.textContent || "").replace(/#+\s*$/, "");
    link.appendChild(text);

    return link;
  }

  public updateTOCContent(): void {
    const tocContent = document.getElementById(this.contentId);
    if (!tocContent) return;

    tocContent.replaceChildren();
    this.unbindClickEvents();
    this.tocItems = [];

    const headings = this.getAllHeadings();
    if (headings.length === 0) {
      tocContent.appendChild(this.createEmptyStateNode());
      return;
    }

    this.minDepth = this.calculateMinDepth(headings);
    const filteredHeadings = this.filterHeadings(headings);
    if (filteredHeadings.length === 0) {
      tocContent.appendChild(this.createEmptyStateNode());
      return;
    }

    const fragment = document.createDocumentFragment();
    let heading1Count = 1;
    filteredHeadings.forEach((heading) => {
      if (!heading.id) return;
      const depth = parseInt(heading.tagName.charAt(1), 10);
      const link = this.createTOCLinkNode(heading, depth, heading1Count);
      if (depth === this.minDepth) {
        heading1Count++;
      }
      fragment.appendChild(link);
    });

    const indicator = document.createElement("div");
    indicator.id = this.indicatorId;
    indicator.style.opacity = "0";
    indicator.className =
      "-z-10 absolute bg-[var(--toc-btn-hover)] left-0 right-0 rounded-xl transition-all";
    fragment.appendChild(indicator);

    tocContent.appendChild(fragment);
    this.tocItems = Array.from(tocContent.querySelectorAll("a"));
  }

  private getVisibleHeadingIds(): string[] {
    const headings = this.getAllHeadings();
    const visibleHeadingIds: string[] = [];

    headings.forEach((heading) => {
      if (!heading.id) return;
      const rect = heading.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        visibleHeadingIds.push(heading.id);
      }
    });

    if (visibleHeadingIds.length === 0 && headings.length > 0) {
      let closestHeading: string | null = null;
      let minDistance = Infinity;
      headings.forEach((heading) => {
        if (!heading.id) return;
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top - this.scrollOffset);
        if (distance < minDistance) {
          minDistance = distance;
          closestHeading = heading.id;
        }
      });
      if (closestHeading) {
        visibleHeadingIds.push(closestHeading);
      }
    }

    return visibleHeadingIds;
  }

  public updateActiveState(): void {
    if (!this.tocItems.length) return;

    this.tocItems.forEach((item) => {
      item.classList.remove("visible");
    });

    const visibleHeadingIds = this.getVisibleHeadingIds();
    const activeItems = this.tocItems.filter((item) => {
      const headingId = item.dataset.headingId;
      return Boolean(headingId && visibleHeadingIds.includes(headingId));
    });

    activeItems.forEach((item) => {
      item.classList.add("visible");
    });

    this.updateActiveIndicator(activeItems);
  }

  private updateActiveIndicator(activeItems: HTMLElement[]): void {
    const indicator = document.getElementById(this.indicatorId);
    if (!indicator || !this.tocItems.length) return;

    if (activeItems.length === 0) {
      indicator.style.opacity = "0";
      return;
    }

    const tocContent = document.getElementById(this.contentId);
    if (!tocContent) return;

    const contentRect = tocContent.getBoundingClientRect();
    const firstActive = activeItems[0];
    const lastActive = activeItems[activeItems.length - 1];

    const firstRect = firstActive.getBoundingClientRect();
    const lastRect = lastActive.getBoundingClientRect();

    const top = firstRect.top - contentRect.top;
    const height = lastRect.bottom - firstRect.top;

    indicator.style.top = `${top}px`;
    indicator.style.height = `${height}px`;
    indicator.style.opacity = "1";

    this.scrollToActiveItem(firstActive);
  }

  private scrollToActiveItem(activeItem: HTMLElement): void {
    const tocContainer = document
      .querySelector(`#${this.contentId}`)
      ?.closest(".toc-scroll-container");
    if (!tocContainer) return;

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = window.setTimeout(() => {
      const containerRect = tocContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const isVisible =
        itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        const itemOffsetTop = activeItem.offsetTop;
        const containerHeight = tocContainer.clientHeight;
        const itemHeight = activeItem.clientHeight;
        const targetScroll = itemOffsetTop - containerHeight / 2 + itemHeight / 2;

        tocContainer.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }, 100);
  }

  public handleClick(event: Event): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLAnchorElement;
    const id = decodeURIComponent(target.getAttribute("href")?.substring(1) || "");
    const targetElement = document.getElementById(id);

    if (!targetElement) return;

    const targetTop =
      targetElement.getBoundingClientRect().top + window.pageYOffset - this.scrollOffset;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  public setupObserver(): void {
    const headings = this.getAllHeadings();

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      () => {
        this.updateActiveState();
      },
      {
        rootMargin: "0px 0px 0px 0px",
        threshold: 0,
      },
    );

    headings.forEach((heading) => {
      if (heading.id) {
        this.observer?.observe(heading);
      }
    });
  }

  public bindClickEvents(): void {
    this.unbindClickEvents();
    this.tocItems.forEach((item) => {
      const handler = this.handleClick.bind(this) as EventListener;
      this.clickHandlers.set(item, handler);
      item.addEventListener("click", handler);
    });
  }

  public unbindClickEvents(): void {
    this.clickHandlers.forEach((handler, element) => {
      element.removeEventListener("click", handler);
    });
    this.clickHandlers.clear();
  }

  public cleanup(): void {
    this.unbindClickEvents();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  public init(): void {
    this.updateTOCContent();
    this.bindClickEvents();
    this.setupObserver();
    this.updateActiveState();
  }
}

export function isPostPage(): boolean {
  return window.location.pathname.includes("/posts/");
}

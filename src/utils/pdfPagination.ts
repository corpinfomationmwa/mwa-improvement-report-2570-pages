// Pagination utility for MWA Official A4 Document

import { CommunicationTopicItem, FeedbackInfo } from '../types/mwa';

export interface PageContentChunk {
  pageIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  items: CommunicationTopicItem[];
  itemStartIndex: number;
  hasProblemAndSuggestion: boolean;
}

/**
 * Calculates estimated height weight of a communication item
 */
function estimateItemWeight(item: CommunicationTopicItem): number {
  let weight = 1.0;
  // Details length factor
  const textLength = (item.details || '').length;
  if (textLength > 300) weight += 1.2;
  else if (textLength > 150) weight += 0.6;
  else if (textLength > 80) weight += 0.3;

  // Additional details
  if ((item.additionalDetails || '').length > 0) weight += 0.3;

  // Selected topics count
  if (item.selectedTopics && item.selectedTopics.length > 2) weight += 0.3;

  // Evidence images count
  const imgCount = (item.evidenceFiles || []).length;
  if (imgCount > 2) weight += 0.8;
  else if (imgCount > 0) weight += 0.4;

  return weight;
}

/**
 * Distributes communication items across A4 pages cleanly.
 * Guarantees NO empty pages and smooth continuation.
 */
export function paginateDocument(
  items: CommunicationTopicItem[],
  feedback: FeedbackInfo
): PageContentChunk[] {
  if (!items || items.length === 0) {
    return [
      {
        pageIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        items: [],
        itemStartIndex: 0,
        hasProblemAndSuggestion: true
      }
    ];
  }

  // Budget for Page 1:
  // Header + Author Info take ~2.0 units of space.
  // Full A4 height is ~6.0 units.
  // So Page 1 has ~4.0 units available for table rows + feedback.
  // Feedback takes ~1.0 unit.
  // Subsequent pages have ~5.5 units available for table rows.

  const pages: PageContentChunk[] = [];
  let currentPageItems: CommunicationTopicItem[] = [];
  let currentCapacity = 2.8; // Page 1 capacity for items allowing feedback
  let currentUsed = 0;
  let pageIndex = 0;
  let itemStartIndex = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const weight = estimateItemWeight(item);

    // If item exceeds current page capacity AND current page is not empty
    if (currentUsed + weight > currentCapacity && currentPageItems.length > 0) {
      pages.push({
        pageIndex,
        isFirstPage: pageIndex === 0,
        isLastPage: false,
        items: [...currentPageItems],
        itemStartIndex,
        hasProblemAndSuggestion: false
      });

      pageIndex++;
      itemStartIndex = i;
      currentPageItems = [item];
      currentCapacity = 4.8; // Page 2+ has more room (no main header & author info)
      currentUsed = weight;
    } else {
      currentPageItems.push(item);
      currentUsed += weight;
    }
  }

  // Last page with remaining items
  const lastPageChunk: PageContentChunk = {
    pageIndex,
    isFirstPage: pageIndex === 0,
    isLastPage: true,
    items: currentPageItems,
    itemStartIndex,
    hasProblemAndSuggestion: true
  };

  pages.push(lastPageChunk);

  // Mark actual isLastPage on the final page
  pages.forEach((p, idx) => {
    p.isLastPage = idx === pages.length - 1;
  });

  return pages;
}

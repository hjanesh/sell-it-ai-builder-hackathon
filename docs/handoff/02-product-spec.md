# 02: Product spec (WIP, base version before merging teammates' docs)

## Positioning
- **A selling assistant, not a marketplace.** We don't replace OLX, Marketplace, Instagram or WhatsApp. We make the
  seller's post *the one that gets picked*, wherever it goes.
- **For anyone selling anything:** people clearing out old things, resellers and Instagram shops, small retailers
  with new stock, **home bakers, tiffin services, craft sellers and boutiques** who post in society WhatsApp groups.

## Core insight
On OLX, the same product shows up in many listings. The one that stands out has clean photos and the details a
buyer checks (age, bill, warranty, defects, reason for selling), and that effort reads as **"this seller is
genuine"**. Most sellers skip it because it's tedious. Sell It does that effort for them.

## The flow
1. **Add photos** (1–6, camera or gallery). Optionally add a **voice note** or text with anything you know.
2. **Detect.** The AI identifies the item (category, brand, model or variant if visible, condition cues) and picks a
   **listing type**, which the user confirms with one tap:
   - **Pre-owned** · **New / unused** · **Homemade / small batch**
   - It also flags missing evidence: "Add a photo with the screen on", "Show the label/bill?"
3. **Smart questions.** Only the questions that matter for this type and category. **All skippable.** Answer with chips,
   short text or a voice note. Pre-fill whatever the photos or voice note already answered.
4. **Photo studio.** Auto-crop to the item, straighten, fix exposure and white balance, clean or soft background
   with a shadow, then export platform sizes. Keep one untouched original. (Honesty rule below.)
5. **Price.** A ₹ range with a recommended figure and the reasons behind it (age, condition, bill/warranty, demand).
   Labelled as an estimate. Optional: comparable listings from web search, with links.
6. **Packs per channel** (tabs): copy, images and hashtags for each platform. See the table below.
7. **Ship it.** Download all (ZIP) · one-tap **Share** to WhatsApp or Instagram · "Post to OLX/Marketplace"
   (assisted) · a **Sell It listing page** link.
8. **Feedback** (always): 👍/👎, "Where will you post?", and an optional comment.

## Questions per listing type (starting set; the AI adapts them by category)
| Pre-owned | New / unused | Homemade / small batch |
|---|---|---|
| When bought (month/year is enough) | Sealed / open box / unused | What's in this batch (items, flavours) |
| Bill / box / warranty left? | MRP and your price | Price per unit or box, minimum order |
| Condition, known defects | Warranty / bill | Veg / eggless / allergens / shelf life |
| What's included (charger, case…) | Quantity available, variants (size/colour) | Order-by date, ready-by date |
| Reason for selling | Why you're selling (gift, extra stock, shop) | Pickup / delivery area, delivery charge |
| Lowest acceptable price (private) | Delivery / pickup | Contact / how to order (WhatsApp, UPI) |
| Location (area, city) | Location | Licence/FSSAI if they have one (optional) |

A **listing-strength meter** (P1) shows which missing details would add the most buyer trust.

## Outputs per channel
| Channel | Images | Text | How it gets posted (today) |
|---|---|---|---|
| **OLX** | Clean photos (4:3 / 1:1) | Short, keyword-rich title + structured description (specs, age, condition, included, reason) | **Assisted:** images saved, text copied, OLX post page opened. No open posting API (OLX Group Partner API needs approval; students and trials aren't approved). |
| **Facebook Marketplace** | Same | Title, price, description | **Assisted**, same as OLX. No posting API for ordinary sellers. |
| **Instagram** | 4:5 feed post + 9:16 story | Caption + hashtags (English / Hinglish) | **One-tap share** via the phone's share sheet. Auto-publish needs a Business account + Meta app review, so it's **roadmap**. |
| **WhatsApp** | **Poster / menu card** (esp. homemade) + 9:16 status | Message with emojis, price, how to order | **One-tap share** via the share sheet, or a `wa.me` link with prefilled text. Works for everyone today. |
| **Sell It listing page** | Gallery | Full details, trust checklist, FAQ | Public link `/l/<id>` with a WhatsApp contact button and a **UPI reserve** link (`upi://pay?...`). This is "post from us" today. |

Languages for copy: English, Hinglish; Hindi/Kannada if time allows (P1).

## Photo honesty rule (non-negotiable: this is a trust product)
- **Allowed:** crop, straighten, exposure/white balance, background removal or replacement, shadow, resizing.
- **Not allowed:** erasing scratches or defects, regenerating or "beautifying" the item with generative image models.
- Always include one **untouched original**. Optional tag: "Photos cleaned up, item not edited".
- Use **segmentation-based background removal**, not generative image editing.

## Explicitly out of scope today
- Scraping OLX or Marketplace (terms of service, login walls, fragile).
- Automating people's OLX or Facebook accounts.
- A native APK (the PWA can be installed; an APK is roadmap).
- Our own marketplace, search, or buyer accounts.

## Stretch (P2)
- An **AI buyer chat** on the listing page that answers questions and negotiates within the seller's lowest price.
- **Bulk mode** for resellers and Instagram shops (many items in one go).
- Pine Labs payments for token reservations.
- Direct posting via platform partnerships (OLX Partner API, Instagram Graph API).

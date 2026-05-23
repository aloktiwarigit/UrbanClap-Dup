# Admin-Web Hindi Field Test — May 2026

**Status:** Planned — offline execution deferred to pilot launch window  
**Target participants:** 2–3 Ayodhya ops staff (Hindi-first, non-English-fluent)  
**Environment:** Production SWA — `https://black-river-0af326a00.7.azurestaticapps.net/hi/dashboard`  
**Story:** E12-S03b

---

## Scope

Verify that a Hindi-first ops operator can navigate and operate the admin dashboard without English-language assistance.

## Test Screens

| Screen | Hindi URL | Primary operations |
|---|---|---|
| Live Ops | /hi/dashboard | Read KPIs, order feed |
| Orders | /hi/orders | Filter, open slide-over, check status labels |
| Finance | /hi/finance | Read P&L summary, payout queue amounts |
| Complaints | /hi/complaints | Kanban column labels, SLA countdown, open slide-over |
| Technicians | /hi/technicians | Roster table, status badges |
| Customers | /hi/customers | Search, customer list |

## Comprehension Checklist (per screen, with participant)

- [ ] Participant locates the correct nav item without assistance
- [ ] All table column headers are readable and understood
- [ ] Action buttons are distinguishable (e.g. स्वीकृत करें ≠ अस्वीकार करें)
- [ ] Status badges are understood: सक्रिय, निष्क्रिय, लंबित, पूर्ण, रद्द
- [ ] Currency displays with lakh grouping: ₹1,23,456 (not ₹1,23,456)
- [ ] Dates display in Hindi format: 5 मई 2026
- [ ] No visible i18n key leaks (e.g. no "orders.list.title" text visible on screen)
- [ ] No English label leaks (e.g. column header "Status" does not appear — "स्थिति" should)
- [ ] Empty states render correctly (कोई ऑर्डर नहीं मिला, etc.)
- [ ] Error/toast messages appear in Hindi

## Known Gaps at Shipping

- **Domain content (service names, category names):** Stored in Cosmos DB in English. Translation is a separate backend story (out of scope for E12-S03b). Participants should expect to see English service names.
- **Technician-app locale-switching:** Not yet shipped (separate story). Technician-side is currently EN-only.
- **Catalogue forms:** Placeholder text like "जैसे: ac-repair" retains slug format — ops staff should be briefed that slugs remain ASCII.

## Feedback Collection Template

After each screen test, document:

```
Screen: _______________________
Participant: ___________________
Comprehension (1-5): ___________
Issues found:
- 
Notes:
```

## Execution Log

| Date | Participant | Screens covered | Outcome |
|---|---|---|---|
| TBD | — | — | Not yet executed |

## Sign-off

- [ ] All 6 screens tested with ≥2 participants
- [ ] All comprehension checklist items passing
- [ ] Feedback captured and filed
- [ ] Story marked complete in docs/stories/README.md

---

*Field test execution requires pilot deployment. Mark COMPLETE only after live testing with Ayodhya ops staff.*

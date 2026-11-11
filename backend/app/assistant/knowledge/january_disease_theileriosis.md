# V-VET Triage & Decision Engine Template

## January Disease (Theileriosis)

*V-VET | Veterinary decision-support template | This document supports triage and escalation; it does not replace veterinary diagnosis.*

### Figure 1. V-VET conversational triage and escalation architecture

The PDF shows two versions of this diagram. The second adds the critical-symptoms check.

**Version 1**

```
Farmer's message
  → Language and symptom extraction
  → Universal signs dictionary
  → Most likely disease profiles
  → Disease-specific follow-up questions
  → Severity / red-flag assessment
  → Decision engine
      ├─ Routine monitoring → Actions → Followups
      └─ Vet escalation     → Actions → Followups
```

**Version 2**

```
Farmer's message
  → Language and symptom extraction
  → Universal signs dictionary
  → Critical symptoms?
      ├─ YES → Vet escalation → Actions → Followups
      └─ NO  → Most likely disease profiles
               → Disease-specific follow-up questions
               → Severity / red-flag assessment
               → Decision engine
                   ├─ Routine monitoring → Actions → Followups
                   └─ Vet escalation     → Actions → Followups
```

**Purpose.** This form captures veterinary knowledge for V-VET. It is organised so that: (1) the farmer describes the problem in their own words; (2) the system identifies signs using the universal signs dictionary; (3) the signs identify possible disease profiles; (4) disease-specific questions assess severity; and (5) the decision engine determines whether to escalate or monitor.

**Important workflow note.** A farmer may only say "the animal is sick." In that case, V-VET should first ask the farmer to describe what they can see, such as changes in eating, movement, breathing, eyes, dung, urine, swelling, behaviour, or skin. The follow-up should remain in plain language and should not require the farmer to know disease names.

## 1. Identity

### Tick-Borne Disease (TBD) Syndrome

A deadly complex of four primary diseases. Collectively, these diseases act as the single greatest threat to the country's national herd, accounting for **60% to 67% of all livestock deaths**

### Theileriosis (January Disease)

| Field | Veterinary input |
| --- | --- |
| Scientific name | *Theileria parva* / Theileriosis |
| Local names | January Disease; other local names: |
| Animal species affected | bovine |
| Why is this disease on the V-VET list? | most common cause of mortality in Zimbabwe |
| Source(s) | Zimbabwe Directorate of Veterinary Services (DVS), Anipedia / University of Pretoria. |
| Confidence | High / Definitive clinical-epidemiological profile. |

## 2. Where and When

| Field | Veterinary input |
| --- | --- |
| Districts/regions | Historically concentrated in the high-rainfall Highveld regions, but recent outbreaks confirm **widespread, multi-province distribution across Zimbabwe** (high risk in Eastern Highlands like Chipinge/Nyanga, Mashonaland, and Midlands).Manicaland (Chipinge/Nyanga), and Masvingo. |
| Seasonal pattern | Historically strictly seasonal peaking in the wet summer months (**December to March**), matching the life cycle of adult *Rhipicephalus appendiculatus* ticks. However, changing climates have shifted cases toward an **erratic, year-round presentation** peak rainy season but no current defined seasonal pattern |
| Typical age | yearlings to adults |
| Risk factors | rain, dry season, inadequate or poor dipping protocols Heavy rain, high humidity, failure to dip weekly, **poor tick-grease application in ears**, use of counterfeit or under-diluted acaricides, and uncontrolled grazing movements. |
| Relevant animal or farm history | Introduction of new animals, proximity to communal dip breakdowns, open border/stray cattle interactions, or local reports of unexplained area mortalities. |

## 3. Course

| Field | Veterinary input |
| --- | --- |
| Course type | ☐ Peracute ☐ Acute ☐ Chronic ☐ other. (All these) |
| Incubation or onset | **10 to 25 days** after the infective bite of a brown ear tick. |
| Typical progression | Proliferation of macroshizonts in lymphoid tissues leads to lymphoid hyperplasia (enlarged nodes), followed by generalized dissemination, causing widespread lymphocytic infiltration of organs, high fever, and severe pulmonary edema. |
| Critical intervention window | Within **24–48 hours of initial fever spike and regional lymph node swelling**. Treatment given after advanced respiratory distress or frothing manifests carries a poor prognosis. |
| What deterioration may look like | Complete recumbency, wide-eyed distress, severe laboured open-mouth breathing, **profuse frothy discharge cascading from the nostrils**, corneal opacity leading to sudden blindness, and terminal convulsions. |

## 4. Disease Profile Keywords

List canonical signs/keywords associated with this disease. Use the same sign names used in the Universal Signs Dictionary where possible. Mark whether each keyword is critical for considering this disease.

| Disease keyword / sign ID | Critical? (Yes/No) | Veterinary notes |
| --- | --- | --- |
| High fever, (40.5 - 41.5) | Yes | Early indicator; animal is dull, stands away from herd, ceases grazing. |
| severe swelling of the lymph nodes, | Yes | Primarily parotid (below ear) and prescapular (shoulder) lymph nodes. |
| breathlessness, Dyspnea | Yes | Caused by severe pulmonary edema as the disease damages internal tissues. |
| froth from the nose, | Yes | Late-stage terminal sign indicating lungs are filling with fluid |
| sudden blindness / cloudy eye | Yes | Caused by bilateral corneal opacity; characteristic of advanced *T. parva* infection. |

## 5. Universal Signs Dictionary

This table is shared across diseases. Describe signs in language a farmer can understand. Add local wording during field testing.

The "Can farmer see it?" options (☐ Yes ☐ No ☐ Sometimes) are unticked for every sign in the PDF.

| Clinical sign | Can farmer see it? | Plain-language wording |
| --- | --- | --- |
| Reduced appetite | ☐ Yes ☐ No ☐ Sometimes | The animal is eating less, has stopped eating, or is no longer grazing. |
| Weakness | ☐ Yes ☐ No ☐ Sometimes | The animal looks dull, is weak, lies down more, or struggles to move. |
| Swelling | ☐ Yes ☐ No ☐ Sometimes | A new lump or swelling can be seen or felt below the ear, under the jaw, neck, shoulder, legs, or belly. (*mbandabvu*). |
| Rapid breathing | ☐ Yes ☐ No ☐ Sometimes | The animal breathes quickly while resting, as if it has just been running. |
| Watery eyes | ☐ Yes ☐ No ☐ Sometimes | Tears run from the eyes more than usual. |
| Cloudy eye | ☐ Yes ☐ No ☐ Sometimes | The eye looks white, grey, milky, or covered by a film. |
| Nasal discharge | ☐ Yes ☐ No ☐ Sometimes | Fluid, mucus, or foam is coming from the nose. |
| Fever / feels hot | ☐ Yes ☐ No ☐ Sometimes | The animal feels unusually hot, or a thermometer shows a high temperature. |
| Red or dark urine | ☐ Yes ☐ No ☐ Sometimes | The urine is red, brown, or the colour of strong tea. Note: *More indicative of Redwater (Babesiosis), but checked to differentiate from January Disease.* |
| Loose dung / diarrhoea | ☐ Yes ☐ No ☐ Sometimes | The dung is much softer or more watery than normal. |
| Abnormal movement or behaviour | ☐ Yes ☐ No ☐ Sometimes | The animal circles, falls, presses its head, staggers, or cannot walk normally. |
| Ticks | ☐ Yes ☐ No ☐ Sometimes | Ticks can be seen on the animal, especially around the ears, tail, belly, or legs. |
| Unable to stand | ☐ Yes ☐ No ☐ Sometimes | The animal cannot rise or cannot remain standing. |
| Drooling or froth | ☐ Yes ☐ No ☐ Sometimes | Saliva or white foam is coming from the mouth or nose. |

## 6. Disease-Specific Follow-Up Questions

Ask fewer than five questions where possible. Use simple words, and include "Not sure" so that a farmer is not forced to guess.

| No. | Farmer-friendly question | Answer options | Why is this question important? |
| --- | --- | --- | --- |
| 1 | Have you felt or seen hard lumps below the ears or in front of the shoulder | ☐ Yes ☐ No ☐ Not sure | Identifies regional lymphadenopathy (*mbandabvu*), the most reliable early physical marker.if we can get people to get accustomed to it. |
| 2 | Is the animal breathing hard, coughing, or blowing bubbles/foam from its nose? | ☐ Yes ☐ No ☐ Not sure | Screens for life-threatening pulmonary edema, which signals the disease has reached a terminal stage |
| 3 | Have the eyes of the animal turned white, milky, or cloudy? | ☐ Yes ☐ No ☐ Not sure | Confirms corneal opacity, helping differentiate this from normal respiratory infections. |
| 4 | Did you miss a dipping session or use a new/different dip chemical in the past 3 weeks? | ☐ Yes ☐ No ☐ Not sure | Assesses the likelihood of a protection breakdown due to tick attachment cycles. |

## 7. Escalation / Decision Engine

Complete the table with the answers that determine urgency. Red-flag answers should override uncertainty about the disease. If the answer is "Not sure" for a serious sign, specify whether to ask again or escalate conservatively.

| Question / condition | Answer or finding | Decision | Timeframe / reason |
| --- | --- | --- | --- |
| Lumps under ears/shoulder AND high fever | Yes | ☐ Escalate to vet | **Immediate (Within 12 hours).** Early therapeutic window for specific antiprotozoals like Buparvaquone |
| | No | ☐ Monitor | Re-check temperature daily if the herd is in an active outbreak zone |
| | Not sure | ☐ Ask again ☐ Escalate | Escalate conservatively due to the rapid 24-48 hour mortality path of the parasite. |
| Breathing with open mouth OR froth from nose | Yes | ☐ Escalate to vet | **CRITICAL EMERGENCY.** Extreme respiratory failure from fluid-filled lungs; requires urgent clinical intervention |
| | No | ☐ Monitor | Monitor respiratory rates twice daily. |
| | Not sure | ☐ Ask again ☐ Escalate | Treat as an emergency. If lungs fail, the mortality rate reaches 80-100%. |
| Milky/cloudy eyes or staggering/blind walking | Yes | ☐ Escalate to vet | **Immediate.** Indicates late-stage cellular infiltration of vital sensory and central nervous systems. |
| | No | ☐ Monitor | Check eyes daily during high-risk rainy periods. |
| | Not sure | ☐ Ask again ☐ Escalate | Escalate. Blindness prevents grazing and leads to self-trauma or starvation. |

## 8. When to Escalate

| Field | Veterinary input |
| --- | --- |
| Escalation level | ☐ Emergency / immediate ☐ Urgent / within 24 hours ☐ Routine veterinary review |
| Emergency indicators | Swollen *mbandabvu* (lymph nodes) paired with a high temperature (>39.5°C), any visible nostril frothing, audible gasping/laboured respiration, or distinct clouding of the eyes.<br><br>Any sudden spike in body temperature above **39.5°C**.<br>• The appearance of **swollen lumps (*mbandabvu*)** under the ear or in front of the shoulder.<br>• Any changes in breathing, such as **rapid chest movements, open-mouth panting, or coughing**.<br>• The presence of **white or clear foam/froth** bubbling from the nose or mouth.<br>• The eyes beginning to look **cloudy, milky, or blueish**, or the animal bumping into walls (blindness). |
| Who should be notified? | PVT vet & Local **Veterinary Extension Officer** or District Office of the Zimbabwe Directorate of Veterinary Services (DVS) within 24 hours (Mandatory reporting under the Animal Health Act). |
| What information should be sent to the vet? | Number of sick vs. dead animals, specific clinical signs noticed (froth, swollen lumps, blindness), date of last dipping, product used, and location coordinates or dip tank number. |

## 9. Actions While Waiting for a Vet

| Action category | Vet-approved guidance |
| --- | --- |
| Safe actions now | **Immediate Isolation:** Move all animals with a temperature above 39.5°C away from the healthy herd into a shaded, quiet enclosure<br><br>Ensure the animal has access to shade and clean water, **Tick Physical Removal & Greasing:** Manually clear visible ticks from the ears and tail head, and immediately apply **Tick Grease** inside the ear canal, around the tail-switch, and under the tail<br><br>The **5-5-4 dipping regime,** Dipping should happen in the **early morning**. |
| Do not do | but do not drench forcefully if the animal is coughing or breathing heavily to prevent aspiration pneumonia. |
| Vet-only actions | **Administer Correct Targeted Treatment:** Under the guidance of your extension worker or Vet, inject an approved anti-protozoal such as **Buparvaquone** (e.g., Butalex, Butachem) at recommended dose rates. Avoid ineffective blood-parasite remedies like Diminazene<br><br>**Supportive Therapy:** For early or suspect block cases, long-acting **Oxytetracycline** may be administered to slow down bacterial complications and parasite multiplication. |

## 10. 24-Hour Follow-Up After Vet Escalation

Repeat the relevant triage questions and record whether each sign is better, the same, or worse.

| What to check | Better / same / worse | What should happen if worse? |
| --- | --- | --- |
| Eating or drinking | ☐ Better ☐ Same ☐ Worse ☐ Unknown | same or worse |
| Standing and walking | ☐ Better ☐ Same ☐ Worse ☐ Unknown | same or worse |
| Breathing while resting | ☐ Better ☐ Same ☐ Worse ☐ Unknown | same or worse |
| Eye changes / discharge / swelling | ☐ Better ☐ Same ☐ Worse ☐ Unknown | same or worse |
| Other disease-specific sign: | ☐ Better ☐ Same ☐ Worse ☐ Unknown | |

## 11. If No Vet Escalation Is Required: Monitor

| Field | Veterinary input |
| --- | --- |
| Monitoring instruction to farmer | |
| Actions appropriate during routine monitoring | |
| Signs that should trigger escalation | |
| Routine follow-up time | ☐ 12 hours ☐ 24 hours ☐ 48 hours ☐ Other: |

## 12. Follow-Up During Routine Monitoring

Use the same relevant triage questions to compare the animal with its earlier condition. Record change rather than asking the farmer to make a diagnosis.

| Question / sign to repeat | Better / same / worse | Action if worse or unchanged |
| --- | --- | --- |
| **Is the animal's body temperature hot?** (Measured by thermometer or feeling the base of ears) | ☐ Better ☐ Same ☐ Worse ☐ Unknown | **Same or Worse:** Immediately escalate to Emergency/Immediate Vet Review. January Disease can kill within 24–48 hours of a persistent fever. |
| Are the lumps under the ears or shoulder (***mbandabvu***) still large or growing? | ☐ Better ☐ Same ☐ Worse ☐ Unknown | **Same or Worse:** Escalate to Vet immediately. This confirms active lymphoid replication of *Theileria parva*. |
| **How is the animal's breathing?** (Look for fast breathing, open mouth, or nose froth) | ☐ Better ☐ Same ☐ Worse ☐ Unknown | **Same or Worse:** CRITICAL RED FLAG. Escalate immediately. Lungs are filling with fluid (pulmonary edema). |
| Are the eyes clear, or are they turning cloudy/milky? | ☐ Better ☐ Same ☐ Worse ☐ Unknown | **If Same or Worse:** Escalate immediately. Signifies advanced, severe systemic infection affecting the ocular tissue. |

## 13. Vet Review and Version Control

| Field | Details |
| --- | --- |
| Completed by | Name: / Role: |
| Reviewed by | Name: / Date: |
| Changes required | |
| Next review date | |

Is it something that needs attention right away,

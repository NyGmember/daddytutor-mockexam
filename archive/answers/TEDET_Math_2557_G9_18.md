---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: "2557"
difficulty: "3"
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "65"
---

# คำถาม

18. กำหนดให้จุด $I$ เป็นจุดศูนย์กลางวงกลมแนบในรูปสามเหลี่ยม $ABC$ ดังรูป

[![illustration](../images/TEDET_Math_2557_G9_18_crop_0.png)]

ถ้า $\angle ABC = 60^\circ$ และ $\angle ACB = 50^\circ$ จงหาว่า $\angle BID$ เท่ากับกี่องศา

# คำอธิบายและวิธีทำ

เนื่องจากจุด $I$ เป็น **จุดศูนย์กลางวงกลมแนบใน (Incenter)** ของรูปสามเหลี่ยม $ABC$:
* เส้นตรงที่ลากจากจุดยอดของรูปสามเหลี่ยมไปยังจุด $I$ จะเป็น **เส้นแบ่งครึ่งมุม (Angle Bisector)** ของมุมยอดแต่ละมุม
* ดังนั้น ส่วนของเส้นตรง $AI, BI, CI$ เป็นเส้นแบ่งครึ่งมุม $\angle BAC, \angle ABC, \angle ACB$ ตามลำดับ

---

### 1. หามุมที่ได้จากเส้นแบ่งครึ่งมุม:
* จากโจทย์กำหนด $\angle ABC = 60^\circ$ และ $BI$ เป็นเส้นแบ่งครึ่งมุม:
  $$\angle ABI = \angle IBC = \frac{60^\circ}{2} = 30^\circ$$

* จากโจทย์กำหนด $\angle ACB = 50^\circ$ และ $CI$ เป็นเส้นแบ่งครึ่งมุม:
  $$\angle ACI = \angle ICB = \frac{50^\circ}{2} = 25^\circ$$

---

### 2. หาขนาดของมุม $\angle BAC$:
ผลบวกของมุมภายในรูปสามเหลี่ยม $ABC$ เท่ากับ $180^\circ$:
$$\angle BAC = 180^\circ - (\angle ABC + \angle ACB)$$
$$\angle BAC = 180^\circ - (60^\circ + 50^\circ) = 70^\circ$$

เนื่องจาก $AI$ เป็นเส้นแบ่งครึ่งมุม $\angle BAC$:
$$\angle BAI = \angle CAI = \frac{70^\circ}{2} = 35^\circ$$

---

### 3. คำนวณหาขนาดของมุม $\angle BID$:
จากรูป จะเห็นว่าส่วนของเส้นตรง $AD$ เป็นเส้นตรงเส้นเดียวกับส่วนของเส้นตรงที่ลากผ่านจุด $A$ และ $I$ ไปยังด้าน $BC$ (จุด $A, I, D$ อยู่ร่วมเส้นตรงเดียวกัน)
* พิจารณาสามเหลี่ยม $ABI$:
  มุม $\angle BID$ เป็นมุมภายนอกของ $\triangle ABI$ ที่เกิดจากการต่อด้าน $AI$ ออกไปทางจุด $D$
  ตามสมบัติของมุมภายนอกสามเหลี่ยม (Exterior Angle Theorem):
  $$\angle BID = \angle BAI + \angle ABI$$
  $$\angle BID = 35^\circ + 30^\circ = 65^\circ$$

---

### *วิธีคิดอีกรูปแบบหนึ่ง (ผ่านการคำนวณสามเหลี่ยม $ABD$):*
1. พิจารณาสามเหลี่ยม $ABD$:
   * $\angle BAD = 35^\circ$
   * $\angle ABD = 60^\circ$
   * จะได้มุม $\angle ADB = 180^\circ - (35^\circ + 60^\circ) = 85^\circ$
2. พิจารณาสามเหลี่ยม $IBD$:
   * $\angle IBD = 30^\circ$
   * $\angle IDB = \angle ADB = 85^\circ$
   * จะได้มุม $\angle BID = 180^\circ - (\angle IBD + \angle IDB) = 180^\circ - (30^\circ + 85^\circ) = 65^\circ$

ดังนั้น ขนาดของมุม $\angle BID$ เท่ากับ **65** องศา

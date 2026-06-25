---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: "2557"
difficulty: "3"
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "24"
---

# คำถาม

20. จากรูป $\angle BAC = \angle ADC = 90^\circ$

[![illustration](../images/TEDET_Math_2557_G9_20_crop_0.png)]

ถ้า $AB = 20\text{ cm}$ และ $BD = 16\text{ cm}$ จงหาว่าผลบวกของความยาวของ $\overline{AC}$ และ $\overline{CD}$ เท่ากับกี่ $\text{cm}$

# คำอธิบายและวิธีทำ

จากความสัมพันธ์ในรูปเรขาคณิตที่กำหนดให้:
* $\triangle ABC$ เป็นรูปสามเหลี่ยมมุมฉากที่มี $\angle BAC = 90^\circ$
* ส่วนสูง $AD$ ตั้งฉากกับส่วนของเส้นตรง $BC$ ทำให้ $\angle ADC = \angle ADB = 90^\circ$
* $AB = 20\text{ cm}$
* $BD = 16\text{ cm}$

---

### 1. หาความยาวของ $AD$:
พิจารณารูปสามเหลี่ยมมุมฉาก $ABD$ (ซึ่งมี $\angle ADB = 90^\circ$):
โดยใช้ทฤษฎีบทพีทาโกรัส:
$$AB^2 = BD^2 + AD^2$$
$$20^2 = 16^2 + AD^2$$
$$400 = 256 + AD^2$$
$$AD^2 = 400 - 256 = 144$$
$$AD = \sqrt{144} = 12\text{ cm}$$

---

### 2. หาความยาวของ $CD$:
เนื่องจาก $\triangle ABC$ เป็นสามเหลี่ยมมุมฉาก และมี $AD$ เป็นส่วนสูงที่ลากมาจากมุมฉาก $A$ ไปตั้งฉากกับด้านตรงข้ามมุมฉาก $BC$
จะได้ว่าสามเหลี่ยมย่อย $\triangle ABD$ คล้ายกับสามเหลี่ยม $\triangle CAD$ ($\triangle ABD \sim \triangle CAD$):
* อัตราส่วนด้านที่สมนัยกันจะเท่ากัน:
  $$\frac{AD}{BD} = \frac{CD}{AD}$$
  $$AD^2 = BD \times CD$$

แทนค่า $AD = 12\text{ cm}$ และ $BD = 16\text{ cm}$ ลงในสมการ:
$$12^2 = 16 \times CD$$
$$144 = 16 \times CD$$
$$CD = \frac{144}{16} = 9\text{ cm}$$

---

### 3. หาความยาวของ $AC$:
พิจารณารูปสามเหลี่ยมมุมฉาก $ACD$ (ซึ่งมี $\angle ADC = 90^\circ$):
โดยใช้ทฤษฎีบทพีทาโกรัส:
$$AC^2 = AD^2 + CD^2$$
$$AC^2 = 12^2 + 9^2$$
$$AC^2 = 144 + 81 = 225$$
$$AC = \sqrt{225} = 15\text{ cm}$$

---

### 4. คำนวณหาผลบวกของความยาวของ $AC$ และ $CD$:
$$AC + CD = 15 + 9 = 24\text{ cm}$$

ดังนั้น ผลบวกของความยาวของ $\overline{AC}$ และ $\overline{CD}$ เท่ากับ **24** $\text{cm}$

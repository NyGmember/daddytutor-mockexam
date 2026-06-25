---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: "2557"
difficulty: "3"
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "36"
---

# คำถาม

10. จากรูป กำหนดให้ $G$ เป็นจุดเซนทรอยด์ของ $\triangle ABC$

[![illustration](../images/TEDET_Math_2557_G9_10_crop_0.png)]

ถ้าพื้นที่ของ $\square ADGE$ เท่ากับ 12 ตารางหน่วย จงหาว่า $\triangle ABC$ มีพื้นที่เท่ากับกี่ตารางหน่วย

# คำอธิบายและวิธีทำ

จากสมบัติของ **จุดเซนทรอยด์ (Centroid)** ซึ่งเป็นจุดตัดของเส้นมัธยฐาน (Medians) ทั้งสามของรูปสามเหลี่ยม:
* เส้นมัธยฐานทั้งสามเส้นจะแบ่งรูปสามเหลี่ยมต้นแบบออกเป็นรูปสามเหลี่ยมย่อยๆ 6 รูปที่มีพื้นที่เท่ากันทุกประการในแง่ของขนาดพื้นที่ (แม้จะมีรูปร่างต่างกัน)

---

### 1. วิเคราะห์รูปสามเหลี่ยมย่อย:
ลากเส้นมัธยฐานทั้งสามของ $\triangle ABC$ ได้แก่ $AE$, $CD$ และเส้นที่ลากจาก $A$ ผ่าน $G$ ไปยังจุดกึ่งกลางของฐาน $BC$ (สมมติให้เป็นจุด $F$)
* เส้นมัธยฐานเหล่านี้จะตัดกันที่จุด $G$ (จุดเซนทรอยด์)
* จะเกิดสามเหลี่ยมย่อย 6 รูปที่มีพื้นที่เท่ากันคือ:
  $$\text{พื้นที่}(\triangle GBD) = \text{พื้นที่}(\triangle GAD) = \text{พื้นที่}(\triangle GAE) = \text{พื้นที่}(\triangle GCE) = \text{พื้นที่}(\triangle GCF) = \text{พื้นที่}(\triangle GBF) = \frac{1}{6} \text{พื้นที่}(\triangle ABC)$$

---

### 2. หาความสัมพันธ์ระหว่างพื้นที่ $\square ADGE$ กับ $\triangle ABC$:
จากรูปสี่เหลี่ยม $ADGE$ จะประกอบด้วยรูปสามเหลี่ยมย่อย 2 รูป คือ $\triangle GAD$ และ $\triangle GAE$:
$$\text{พื้นที่}(\square ADGE) = \text{พื้นที่}(\triangle GAD) + \text{พื้นที่}(\triangle GAE)$$
$$\text{พื้นที่}(\square ADGE) = \frac{1}{6}\text{พื้นที่}(\triangle ABC) + \frac{1}{6}\text{พื้นที่}(\triangle ABC) = \frac{1}{3}\text{พื้นที่}(\triangle ABC)$$

---

### 3. คำนวณหาพื้นที่ของ $\triangle ABC$:
โจทย์กำหนดให้ พื้นที่ของ $\square ADGE$ เท่ากับ 12 ตารางหน่วย:
$$12 = \frac{1}{3}\text{พื้นที่}(\triangle ABC)$$
$$\text{พื้นที่}(\triangle ABC) = 12 \times 3 = 36 \text{ ตารางหน่วย}$$

ดังนั้น พื้นที่ของ $\triangle ABC$ เท่ากับ **36** ตารางหน่วย

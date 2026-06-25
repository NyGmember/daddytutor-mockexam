---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: "2557"
difficulty: "3"
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "98"
---

# คำถาม

24. กำหนดรูปสี่เหลี่ยมคางหมู $ABCD$ ซึ่ง $\overline{AD} \parallel \overline{BC}$ และ $AD = 6\text{ cm}$ และ $BC = 15\text{ cm}$ ดังรูป

[![illustration](../images/TEDET_Math_2557_G9_24_crop_0.png)]

ถ้าเส้นทแยงมุม $AC$ กับ $BD$ ตัดกันที่จุด $E$ และ $\triangle AED$ มีพื้นที่ $8\text{ cm}^2$ จงหาว่ารูปสี่เหลี่ยมคางหมู $ABCD$ มีพื้นที่กี่ $\text{cm}^2$

# คำอธิบายและวิธีทำ

เนื่องจาก $\overline{AD} \parallel \overline{BC}$ จะได้ว่าสามเหลี่ยม $\triangle AED$ และสามเหลี่ยม $\triangle CEB$ เป็นสามเหลี่ยมที่คล้ายกัน ($\triangle AED \sim \triangle CEB$)

---

### 1. หาอัตราส่วนความคล้ายและพื้นที่ของ $\triangle CEB$:
* อัตราส่วนความยาวด้านที่สมนัยกันคือ:
  $$\frac{AD}{BC} = \frac{6}{15} = \frac{2}{5}$$
* อัตราส่วนของพื้นที่ของสามเหลี่ยมคล้าย จะเท่ากับกำลังสองของอัตราส่วนความคล้าย:
  $$\frac{\text{Area}(\triangle AED)}{\text{Area}(\triangle CEB)} = \left(\frac{2}{5}\right)^2 = \frac{4}{25}$$
* โจทย์กำหนดให้ $\text{Area}(\triangle AED) = 8\text{ cm}^2$ แทนค่าลงในอัตราส่วนเพื่อหาพื้นที่ $\triangle CEB$:
  $$\frac{8}{\text{Area}(\triangle CEB)} = \frac{4}{25}$$
  $$\text{Area}(\triangle CEB) = \frac{8 \times 25}{4} = 50\text{ cm}^2$$

---

### 2. หาพื้นที่ของสามเหลี่ยมด้านข้าง $\triangle AEB$ และ $\triangle DEC$:
* พิจารณาสามเหลี่ยม $\triangle AEB$ และสามเหลี่ยม $\triangle AED$ ซึ่งมีจุดยอดร่วมกันที่จุด $A$ และฐาน $EB$ กับ $ED$ อยู่บนเส้นตรงเดียวกัน ($BD$)
* อัตราส่วนของฐานคือ:
  $$\frac{EB}{ED} = \frac{BC}{AD} = \frac{15}{6} = \frac{5}{2}$$
* เนื่องจากมีความสูงร่วมกัน อัตราส่วนพื้นที่จึงเท่ากับอัตราส่วนของฐาน:
  $$\frac{\text{Area}(\triangle AEB)}{\text{Area}(\triangle AED)} = \frac{5}{2}$$
  $$\text{Area}(\triangle AEB) = \frac{5}{2} \times 8 = 20\text{ cm}^2$$
* ในทำนองเดียวกัน สำหรับสามเหลี่ยม $\triangle DEC$ และ $\triangle AED$:
  $$\text{Area}(\triangle DEC) = \text{Area}(\triangle AEB) = 20\text{ cm}^2$$

---

### 3. คำนวณพื้นที่รวมของรูปสี่เหลี่ยมคางหมู $ABCD$:
พื้นที่รูปสี่เหลี่ยมคางหมู $ABCD$ เกิดจากผลรวมพื้นที่ของสามเหลี่ยมทั้ง 4 รูปย่อย:
$$\text{Area}(ABCD) = \text{Area}(\triangle AED) + \text{Area}(\triangle CEB) + \text{Area}(\triangle AEB) + \text{Area}(\triangle DEC)$$
$$\text{Area}(ABCD) = 8 + 50 + 20 + 20 = 98\text{ cm}^2$$

ดังนั้น พื้นที่ของรูปสี่เหลี่ยมคางหมู $ABCD$ เท่ากับ **98** $\text{cm}^2$

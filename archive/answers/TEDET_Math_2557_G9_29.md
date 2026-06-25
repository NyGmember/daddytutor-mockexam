---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G9"
year: 2557
difficulty: 4
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "75"
---

# คำอธิบายและวิธีทำ

### 1. หาความสัมพันธ์ในรูปสามเหลี่ยม $\triangle ABC$:
* มุมภายในของสามเหลี่ยม $\triangle ABC$ รวมกันได้ $180^\circ$:
  $$\angle ACB = 180^\circ - (\angle ABC + \angle BAC) = 180^\circ - (120^\circ + 15^\circ) = 45^\circ$$
* กำหนดให้ความยาวของด้าน $BC = x$ จากโจทย์กำหนด $DB = 2BC$ จะได้ $DB = 2x$
* หาความยาวของด้าน $AB$ โดยใช้ **กฎของไซน์ (Law of Sines)** ใน $\triangle ABC$:
  $$\frac{AB}{\sin(\angle ACB)} = \frac{BC}{\sin(\angle BAC)}$$
  $$\frac{AB}{\sin 45^\circ} = \frac{x}{\sin 15^\circ} \implies AB = x \frac{\sin 45^\circ}{\sin 15^\circ}$$

* คำนวณค่า $\sin 15^\circ$:
  $$\sin 15^\circ = \sin(45^\circ - 30^\circ) = \sin 45^\circ \cos 30^\circ - \cos 45^\circ \sin 30^\circ$$
  $$\sin 15^\circ = \frac{\sqrt{2}}{2} \cdot \frac{\sqrt{3}}{2} - \frac{\sqrt{2}}{2} \cdot \frac{1}{2} = \frac{\sqrt{6} - \sqrt{2}}{4}$$
* แทนค่าเพื่อหา $AB$:
  $$AB = x \frac{\sqrt{2}/2}{(\sqrt{6} - \sqrt{2})/4} = x \frac{2\sqrt{2}}{\sqrt{6} - \sqrt{2}} = x \frac{2}{\sqrt{3} - 1}$$
  คอนจูเกตเพื่อจัดรูป:
  $$AB = x \frac{2(\sqrt{3} + 1)}{(\sqrt{3} - 1)(\sqrt{3} + 1)} = (\sqrt{3} + 1)x$$

---

### 2. หาความยาวของด้าน $AD$ ใน $\triangle ABD$:
* เนื่องจากจุด $D, B, C$ เรียงตัวกันบนเส้นตรงเดียวกัน จะได้มุม:
  $$\angle ABD = 180^\circ - \angle ABC = 180^\circ - 120^\circ = 60^\circ$$
* ใช้ **กฎของโคไซน์ (Law of Cosines)** ใน $\triangle ABD$ เพื่อหาความยาวของ $AD$:
  $$AD^2 = AB^2 + DB^2 - 2(AB)(DB)\cos(\angle ABD)$$
  แทนค่า $AB = (\sqrt{3} + 1)x$, $DB = 2x$, และ $\angle ABD = 60^\circ$ (โดยที่ $\cos 60^\circ = \frac{1}{2}$):
  $$AD^2 = [(\sqrt{3} + 1)x]^2 + (2x)^2 - 2(\sqrt{3} + 1)x(2x)\left(\frac{1}{2}\right)$$
  $$AD^2 = (3 + 2\sqrt{3} + 1)x^2 + 4x^2 - 2(\sqrt{3} + 1)x^2$$
  $$AD^2 = (4 + 2\sqrt{3})x^2 + 4x^2 - (2\sqrt{3} + 2)x^2$$
  $$AD^2 = (4 + 2\sqrt{3} + 4 - 2\sqrt{3} - 2)x^2 = 6x^2$$
  ดังนั้น จะได้:
  $$AD = \sqrt{6}x$$

---

### 3. คำนวณหาค่ามุม $\angle ADB$:
* ใช้กฎของโคไซน์ใน $\triangle ABD$ อีกครั้งเพื่อหามุม $\angle ADB$:
  $$AB^2 = AD^2 + DB^2 - 2(AD)(DB)\cos(\angle ADB)$$
  แทนค่าที่มี:
  $$[(\sqrt{3} + 1)x]^2 = (\sqrt{6}x)^2 + (2x)^2 - 2(\sqrt{6}x)(2x)\cos(\angle ADB)$$
  $$(4 + 2\sqrt{3})x^2 = 6x^2 + 4x^2 - 4\sqrt{6}x^2\cos(\angle ADB)$$
  $$(4 + 2\sqrt{3})x^2 = 10x^2 - 4\sqrt{6}x^2\cos(\angle ADB)$$
  $$4\sqrt{6}\cos(\angle ADB) = 10 - (4 + 2\sqrt{3}) = 6 - 2\sqrt{3}$$
  $$\cos(\angle ADB) = \frac{6 - 2\sqrt{3}}{4\sqrt{6}} = \frac{2\sqrt{3}(\sqrt{3} - 1)}{4\sqrt{2}\sqrt{3}} = \frac{\sqrt{3} - 1}{2\sqrt{2}}$$
  จัดรูปตัวส่วนโดยการคูณด้วย $\sqrt{2}$ ทั้งเศษและส่วน:
  $$\cos(\angle ADB) = \frac{\sqrt{6} - \sqrt{2}}{4}$$

* จากความรู้ตรีโกณมิติ:
  $$\cos 75^\circ = \cos(45^\circ + 30^\circ) = \cos 45^\circ \cos 30^\circ - \sin 45^\circ \sin 30^\circ = \frac{\sqrt{6} - \sqrt{2}}{4}$$
  ดังนั้น:
  $$\angle ADB = 75^\circ$$

ดังนั้น $\angle ADB$ เท่ากับ **75** องศา

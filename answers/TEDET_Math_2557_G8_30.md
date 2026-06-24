---
exam_name: "TEDET"
subject: "คณิตศาสตร์"
level: "มัธยมต้น (G7-G9)"
grade: "G8"
year: 2557
difficulty: 5
topic_id: "measurement_and_geometry"
topic_name: "การวัดและเรขาคณิต"
answer: "50"
---

# คำอธิบายและวิธีทำ

จากข้อมูลที่กำหนดให้:
* ในสามเหลี่ยมหน้าจั่ว $ABC$ มี $AB = AC$ และมีมุมยอด $\angle A = 20^\circ$
* $AD = BD$
* $BE = BC$

---

### 1. คำนวณหามุมพื้นฐานของรูปสามเหลี่ยม:
* เนื่องจาก $AB = AC$ มุมที่ฐานของสามเหลี่ยมหน้าจั่ว $ABC$ จึงเท่ากัน:
  $$\angle ABC = \angle ACB = \frac{180^\circ - 20^\circ}{2} = 80^\circ$$

* เนื่องจาก $AD = BD$ จะได้สามเหลี่ยมหน้าจั่ว $ABD$ ที่มี $BD = AD$:
  $$\angle ABD = \angle BAD = 20^\circ$$
  ดังนั้น:
  $$\angle DBC = \angle ABC - \angle ABD = 80^\circ - 20^\circ = 60^\circ$$
  และ
  $$\angle BDC = \angle A + \angle ABD = 20^\circ + 20^\circ = 40^\circ$$ (มุมภายนอกของสามเหลี่ยม $ABD$)

* เนื่องจาก $BE = BC$ จะได้สามเหลี่ยมหน้าจั่ว $EBC$ ที่มี $BE = BC$ และมีมุมยอด $\angle EBC = 80^\circ$:
  $$\angle BEC = \angle BCE = \frac{180^\circ - 80^\circ}{2} = 50^\circ$$
  ส่งผลให้:
  $$\angle ACE = \angle ACB - \angle BCE = 80^\circ - 50^\circ = 30^\circ$$

---

### 2. หาขนาดของ $\angle BDE$:
ใช้กฎของไซน์ (Law of Sines) บนสามเหลี่ยมต่างๆ เพื่อหาขนาดของมุม:
* ในสามเหลี่ยม $BCD$ ด้วยกฎของไซน์:
  $$\frac{BD}{\sin 80^\circ} = \frac{BC}{\sin 40^\circ}$$
  $$BD = BC \frac{\sin 80^\circ}{\sin 40^\circ} = BC \frac{2\sin 40^\circ\cos 40^\circ}{\sin 40^\circ} = 2BC\cos 40^\circ$$

* เนื่องจาก $BE = BC$ จะได้:
  $$BD = 2BE\cos 40^\circ$$

* พิจารณาสามเหลี่ยม $BDE$:
  เราทราบว่า $BD = 2BE\cos 40^\circ$, $BE = BC$ และมุมระหว่างด้านทั้งสองคือ $\angle DBE = \angle ABD = 20^\circ$
  ใช้กฎของโคไซน์ (Law of Cosines) ในสามเหลี่ยม $BDE$ เพื่อหาความยาวของ $DE$:
  $$DE^2 = BD^2 + BE^2 - 2 \cdot BD \cdot BE \cos 20^\circ$$
  แทนค่า $BD = 2BC\cos 40^\circ$ และ $BE = BC$:
  $$DE^2 = (2BC\cos 40^\circ)^2 + BC^2 - 2(2BC\cos 40^\circ)BC\cos 20^\circ$$
  $$DE^2 = BC^2 (4\cos^2 40^\circ + 1 - 4\cos 40^\circ\cos 20^\circ)$$

  ใช้เอกลักษณ์ทางตรีโกณมิติเพื่อลดรูปในวงเล็บ:
  * $4\cos^2 40^\circ = 2(1 + \cos 80^\circ) = 2 + 2\cos 80^\circ$
  * $4\cos 40^\circ\cos 20^\circ = 2(\cos 60^\circ + \cos 20^\circ) = 2\left(\frac{1}{2} + \cos 20^\circ\right) = 1 + 2\cos 20^\circ$
  
  แทนกลับลงไป:
  $$4\cos^2 40^\circ + 1 - 4\cos 40^\circ\cos 20^\circ = (2 + 2\cos 80^\circ) + 1 - (1 + 2\cos 20^\circ)$$
  $$= 2 + 2\cos 80^\circ - 2\cos 20^\circ$$
  $$= 2 - 2(\cos 20^\circ - \cos 80^\circ)$$
  $$= 2 - 2(2\sin 50^\circ\sin 30^\circ) = 2 - 2\sin 50^\circ$$ (เนื่องจาก $\sin 30^\circ = 0.5$)
  $$= 2 - 2\cos 40^\circ = 2(1 - \cos 40^\circ) = 4\sin^2 20^\circ$$

  ดังนั้น:
  $$DE^2 = BC^2(4\sin^2 20^\circ) \implies DE = 2BC\sin 20^\circ$$

* ใช้กฎของไซน์ในสามเหลี่ยม $BDE$:
  $$\frac{\sin \angle BDE}{BE} = \frac{\sin \angle DBE}{DE}$$
  $$\sin \angle BDE = BE \frac{\sin 20^\circ}{2BC\sin 20^\circ} = \frac{1}{2}$$ (เนื่องจาก $BE = BC$)
  
  จะได้ $\angle BDE = 30^\circ$ หรือ $150^\circ$
  เมื่อพิจารณาจากขนาดของด้าน $BD > BE$ มุมตรงข้ามด้านที่ยาวกว่าต้องมีขนาดใหญ่กว่า ($\angle BED > \angle BDE$)
  หาก $\angle BDE = 150^\circ$ จะได้ $\angle BED + \angle BDE = 150^\circ + \angle BED > 300^\circ$ ซึ่งเป็นไปไม่ได้
  ดังนั้น:
  $$\angle BDE = 30^\circ$$
  และ
  $$\angle BED = 180^\circ - (20^\circ + 30^\circ) = 130^\circ$$

---

### 3. หาขนาดของ $\angle CED$:
* จุด $E$ อยู่บนด้าน $AB$ ดังนั้น:
  $$\angle AED = 180^\circ - \angle BED = 180^\circ - 130^\circ = 50^\circ$$
* มุมประชิดบนเส้นตรงที่จุด $E$:
  $$\angle AEC = 180^\circ - \angle BEC = 180^\circ - 50^\circ = 130^\circ$$
* จากความสัมพันธ์ของมุมรอบจุด $E$:
  $$\angle CED = \angle AEC - \angle AED = 130^\circ - 50^\circ = 80^\circ$$

---

### 4. คำนวณหาผลต่าง:
โจทย์ถามว่า $\angle CED$ มีขนาดใหญ่กว่า $\angle BDE$ กี่องศา:
$$\angle CED - \angle BDE = 80^\circ - 30^\circ = 50^\circ$$

ดังนั้น $\angle CED$ มีขนาดใหญ่กว่า $\angle BDE$ อยู่ **50** องศา

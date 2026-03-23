### Procedure

##### 1. Load the input image (e.g., sample.jpg) and convert it to RGB/grayscale as needed. 

##### 2. Apply smoothing filters:

 • Mean filter using cv2.blur().

 • Gaussian filter using cv2.GaussianBlur().

 • Median filter using cv2.medianBlur(). 

##### 3. Apply sharpening filters:

 • Laplacian filter using cv2.Laplacian(). 

• Unsharp masking using weighted subtraction of blurred image from original. 

##### 4. Display and compare all results using Matplotlib. 

##### 5. Observe changes in noise reduction and edge clarity.

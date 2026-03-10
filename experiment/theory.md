Digital images often have noise, low contrast, or poor detail visibility because of limits in imaging sensors, lighting, or environmental conditions. Image enhancement techniques help improve how an image looks or change it into a form better suited for analysis. Two main types of enhancement in the spatial domain are:

#### 1. Smoothing Filters

   These filters help reduce noise and small details in images. 

• **Mean Filter**: Replaces each pixel with the average of its neighbors. Useful for reducing  Gaussian noise but may blur edges. 

 • **Gaussian Filter**: Uses a Gaussian kernel to give more weight to central pixels, resulting in smoother blurring        

**• Median Filter:**  Replaces each pixel with the median of its neighbors. Very effective for removing salt-and-pepper noise while keeping edges intact.

#### 2. Sharpening Filters

   These filters enhance edges and fine details by emphasizing intensity changes.

• **Laplacian Filter:**  Highlights areas of rapid intensity change using second-order derivatives

**• Unsharp Masking:** Created by subtracting a blurred version of the image from  the   original,  highlighting high-frequency details.    

Mathematically, 

   g(x, y) = f(x, y) − λ∇2 f(x, y) 

where ∇2f(x, y) is the Laplacian of the image and λ is a scaling factor controlling enhancement strength

---
title: "How To: Customize Voyager branding"
summary: Options for customizing Voyager Explorer branding
weight: 135
---
*TL;DR - Replace the default SVG logos/spinner in the Voyager assets/images folder.*

The default distribution of Voyager Explorer has a logo in the upper-right corner and loading spinner that can both be customized.

These images are found in the 'assets/images/' folder of the Voyager package. By default, Voyager points 
to a [CDN](https://cdn.jsdelivr.net/gh/smithsonian/dpo-voyager@latest/assets/) for the asset folder. **So to customize any images, you will have to have your own copy of 
the asset folder and point to it using the ['resourceRoot' configuration attribute](../api).**

### How do I change the Voyager Explorer logo?

**Option 1: No logo**

If you prefer to have no logo at all, see [API Example: UI Configuration](../api-examples/ui-config/) for information on how to customize 
what UI components are displayed in Voyager.

**Option 2: Adding your own logo**

* Step 1: Configure Voyager for a custom resource folder
    
    If you have deployed your own Voyager package, simply point the component to the local 'assets' folder using the ['resourceRoot' attribute](../api). For a default 
installation using the provided sample pages, this could just be the relative path './'. If you have changed the folder structure or your landing page is hosted elsewhere,
update the path accordingly.

    If you are not using a local Voyager package, you will still need to have a copy of the 'assets' folder. You can grab it from the [most recent GitHub distribution]
(https://github.com/Smithsonian/dpo-voyager/releases/latest) or [CDN](https://cdn.jsdelivr.net/gh/smithsonian/dpo-voyager@latest/). Put this folder somewhere accessible
online and then point your resourceRoot path to it as described above.

* Step 2: Get/create an appropriate logo

    There are two Voyager logos, small and full. Small is displayed when the title element and logo element begin to overlap to allow as much room for the title as possible.
The full logo displays at all other times.

    Logos must be in the [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) format.

    **Small**: This logo image should be square and look legible at 40px by 40px.

    **Full**: This logo image should follow a 2:9 aspect ration (height:width) and look legible at 40px by 180px. If your logo is not long enough to fill that space, add padding to the left-hand
side of the image.

* Step 3: Replace default images

    Name your new logos 'logo-sm.svg' and 'logo-full.svg' and replace the default logos in your assets/images folder by the same name. The file names **must** be the same for Voyager
to successfully find them.      
    
### How do I change the Voyager Explorer loading spinner?

* Follow 'Step 1' from the logo instructions above to configure your resource folder.

* Create a new square spinner image in the [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) format that looks good at 120px by 120px and save it as 'spinner.svg'.
Replace the default spinner in your assets/images folder by the same name. The file name **must** be the same for Voyager to successfully find it.

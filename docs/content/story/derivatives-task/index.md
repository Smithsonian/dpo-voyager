---
title: Derivatives Task
summary: Inspect a model's mesh and textures at various quality levels.
weight: 220
---

Use the Derivatives Task to inspect the various web derivatives your model consists of. Depending on your processing
pipeline, each model in a scene consists of multiple levels of detail.

{{% info "The Derivatives Task is only available if Voyager Story is started in QC mode." %}}

1. Select the {{% button Derivatives %}} Task in the task bar.
2. Select the model you want to inspect. A list of available derivatives appears in the task panel.
3. Select the derivative level you would like to inspect.

![Derivatives Task](derivatives-task.jpg)

Level   | Description
--------|------------
Thumb   | The lowest available representation. Always loaded first, with the goal of displaying a first representation of the model as quickly as possible. We recommend using a compressed GLB file with a total size of less than 200k.
Low     | Used on older mobile devices. Maximum texture size: 1024 x 1024 pixels. Recommended mesh size: ~150k faces.
Medium  | Used on newer mobile devices. Maximum texture size: 2048 x 2048 pixels. Recommended mesh size: ~150k faces.
High    | Used on desktop devices. Maximum texture size: 4096 x 4096 pixels. Recommended mesh size: ~150k faces.
Highest | Used for quality inspection. Texture size: 4k or 8k. Mesh size: ~500k faces.

{{% info "Depending on how your model was processed, not all derivative levels might be available. It is possible to use just one derivative for each model. In this case, features such as device-dependent and progressive loading are not available." %}}


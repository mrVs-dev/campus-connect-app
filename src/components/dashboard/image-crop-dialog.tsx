"use client";

import * as React from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  onOpenChange: (open: boolean) => void;
}

// Function to center the crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}


export function ImageCropDialog({
  imageSrc,
  onCropComplete,
  onOpenChange,
}: ImageCropDialogProps) {
  const [crop, setCrop] = React.useState<Crop>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, 1);
    setCrop(initialCrop);
  }

  const handleCrop = () => {
    if (!crop || !imgRef.current) return;
    
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    onCropComplete(canvas.toDataURL("image/jpeg"));
  };

  return (
    <Dialog open={!!imageSrc} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crop Profile Photo</DialogTitle>
          <DialogDescription>
            Adjust the image below to set the perfect profile picture.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} alt="Crop me" src={imageSrc} onLoad={onImageLoad} style={{ maxHeight: '70vh' }} />
            </ReactCrop>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>Save Photo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

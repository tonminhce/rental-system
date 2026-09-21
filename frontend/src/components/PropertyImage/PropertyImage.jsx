"use client";
import "./PropertyImage.scss";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";

export default function PropertyImage({ src, width, height, alt = "Rental property photo", priority = false }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setFailed(false);
    setAttempt(0);
  }, [src]);
  if (!src) return null;

  width = width || "100%";
  height = height || "100%";
  return (
    <div style={{ width, height }} className="propertyImage_container">
      {failed ? (
        <Box
          role="status"
          sx={{
            height: "100%",
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            bgcolor: "var(--rt-surface-tint)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            This photo couldn’t be loaded.
          </Typography>
          <Button
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Retry photo
          </Button>
        </Box>
      ) : (
        <>
          <Image
            key={`${src}:${attempt}`}
            alt={alt}
            className="propertyImage_main"
            src={src}
            fill
            priority={priority}
            onError={() => setFailed(true)}
            sizes="(max-width: 760px) 100vw, 70vw"
          />
          <Image
            alt=""
            aria-hidden="true"
            className="propertyImage_overlay"
            src={src}
            fill
            sizes="(max-width: 760px) 100vw, 70vw"
          />
        </>
      )}
    </div>
  );
}

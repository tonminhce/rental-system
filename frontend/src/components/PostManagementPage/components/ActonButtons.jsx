import { DeleteOutline, EditNoteOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { useState } from "react";

export default function ActionButtons({ postId, postTitle }) {
  const [postVisibility, setPostVisibility] = useState(true);

  const openDeleteConfirmationDialog = (postId, postTitle) => {
    const event = new CustomEvent("delete-confirmation", { detail: { postId, postTitle } });
    window.dispatchEvent(event);
  };

  const toggleDisplayPost = (postId) => {
    const event = new CustomEvent("toggle-display", { detail: { postId, visibility: !postVisibility } });
    setPostVisibility((prev) => !prev);
    window.dispatchEvent(event);
  };

  return (
    <>
      <Stack height={100} direction="row" alignItems="center">
        <Tooltip title="Hide post">
          <IconButton aria-label="hide">
            {postVisibility ? (
              <VisibilityOutlined fontSize="inherit" onClick={() => toggleDisplayPost(postId)} />
            ) : (
              <VisibilityOffOutlined fontSize="inherit" onClick={() => toggleDisplayPost(postId)} />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip title="Edit post">
          <IconButton color="info" aria-label="edit post">
            <EditNoteOutlined fontSize="inherit" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete post">
          <IconButton
            color="error"
            aria-label="delete post"
            onClick={() => openDeleteConfirmationDialog(postId, postTitle)}
          >
            <DeleteOutline fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
}

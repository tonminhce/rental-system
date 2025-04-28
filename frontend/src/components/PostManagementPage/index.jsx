"use client";
import { useDeletePostMutation, useGetMyPropertiesQuery } from "@/redux/features/landlord/api";
import { DeleteOutline, EditNoteOutlined, VisibilityOffOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Tooltip, Typography, Snackbar } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import NoRowsOverlay from "./components/NoRowsOverlay";
import ActionButtons from "./components/ActonButtons";
import ConfirmDialog from "../ConfirmDialog";

const columns = [
  { field: "id", headerName: "ID", width: 60 },
  { field: "postId", headerName: "Post ID", width: 0 },
  {
    field: "thumbnail",
    headerName: "Thumbnail",
    width: 120,
    renderCell: (params) => (
      <img width={100} height={100} style={{ paddingTop: 10, paddingBottom: 10 }} src={params.value} />
    ),
  },
  {
    field: "name",
    headerName: "Title",
    width: 600,
    renderCell: (params) => <div className="titleCell">{params.value}</div>,
  },
  {
    field: "status",
    headerName: "Status",
    width: 150,
    renderCell: (params) => <Chip label={params.value} color="success" variant="outlined" />,
  },
  {
    field: "actions",
    headerName: "Actions",
    sortable: false,
    width: 150,
    renderCell: (params) => {
      return <ActionButtons postTitle={params.row.name} postId={params.row.postId} refetch={() => {}} />;
    },
    disableClickEventBubbling: true,
  },
];

const PostManagementPage = () => {
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deletePost, { isLoading: isDeleting, isSuccess, isError }] = useDeletePostMutation();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [pagination, setPagination] = useState({
    pageSize: 5,
    page: 0,
  });

  const { data, error, isLoading, refetch } = useGetMyPropertiesQuery({
    page: pagination.page + 1,
    limit: pagination.pageSize,
  });

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId).unwrap();
      setSnackbarMessage("Post deleted successfully");
      const event = new CustomEvent("post-deleted", { detail: { postId, status: "success" } });
      window.dispatchEvent(event);
    } catch (error) {
      setSnackbarMessage("Error deleting post");
    }
    setOpenDeleteConfirmation(false);
    setOpenSnackbar(true);
  };

  useEffect(() => {
    const handleOpenDeleteConfirmation = (event) => {
      setOpenDeleteConfirmation(true);
      setSelectedPost({
        postId: event.detail.postId,
        postTitle: event.detail.postTitle,
      });
    };

    const handlePostToggleDisplay = (event) => {
      setSnackbarMessage("Post visibility toggled successfully");
      setOpenSnackbar(true);
    };

    window.addEventListener("delete-confirmation", handleOpenDeleteConfirmation);
    window.addEventListener("post-deleted", refetch);
    window.addEventListener("toggle-display", handlePostToggleDisplay);

    return () => {
      window.removeEventListener("post-deleted", refetch);
      window.removeEventListener("delete-confirmation", handleOpenDeleteConfirmation);
      window.removeEventListener("toggle-display", handlePostToggleDisplay);
    };
  }, [refetch]);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;

  const rows = (data?.properties ?? []).map((property, index) => ({
    id: index + 1 + pagination.page * pagination.pageSize,
    postId: property._id,
    thumbnail: property.thumbnail,
    name: property.name,
    status: "Active",
  }));

  return (
    <Box sx={{ width: "100%", height: "calc(100vh - 60px)", overflow: "auto", px: 4, pt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Posts
      </Typography>

      <DataGrid
        initialState={{
          columns: {
            columnVisibilityModel: {
              postId: false,
            },
          },
        }}
        columns={columns}
        rows={rows}
        rowCount={data?.pagination?.total_records ?? 0}
        rowHeight={100}
        autoHeight
        paginationModel={pagination}
        paginationMode="server"
        onPaginationModelChange={setPagination}
        checkboxSelection
        slots={{ noRowsOverlay: NoRowsOverlay }}
        sx={{ "--DataGrid-overlayHeight": "350px" }}
      />

      <ConfirmDialog
        postTitle={selectedPost?.postTitle}
        open={openDeleteConfirmation}
        onCancel={() => setOpenDeleteConfirmation(false)}
        onConfirm={() => handleDeletePost(selectedPost?.postId)}
      />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default PostManagementPage;

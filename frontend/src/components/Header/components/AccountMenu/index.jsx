import { ListItemIcon, Menu, MenuItem } from "@mui/material";

import { removeUserInfo } from "@/redux/features/auth/authSlice";
import {
  ExitToAppOutlined,
  HomeOutlined,
  LockClockOutlined,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useState } from "react";
import ChangePasswordDialog from "@/components/Auth/ChangePasswordDialog";

export default function AccountMenu({ anchorEl, open, handleClose }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const logout = () => {
    router.push("/");
    dispatch(removeUserInfo());
  };

  const handleChangePasswordClick = () => {
    handleClose();
    setChangePasswordOpen(true);
  };

  const handleChangePasswordClose = () => {
    setChangePasswordOpen(false);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <PersonOutlineOutlined sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Update profile
        </MenuItem>
        <MenuItem onClick={handleChangePasswordClick}>
          <ListItemIcon>
            <LockClockOutlined sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Change password
        </MenuItem>
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <ExitToAppOutlined sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <ChangePasswordDialog 
        open={changePasswordOpen} 
        onClose={handleChangePasswordClose} 
      />
    </>
  );
}

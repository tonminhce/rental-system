import { ListItemIcon, Menu, MenuItem } from "@mui/material";

import { removeUserInfo } from "@/redux/features/auth/authSlice";
import { useLogoutMutation } from "@/redux/features/auth/authApiSlice";
import { ExitToAppOutlined, HomeOutlined, LockClockOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import ChangePasswordDialog from "@/components/Auth/ChangePasswordDialog";

export default function AccountMenu({ anchorEl, open, handleClose }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const refreshToken = useSelector((s) => s.auth.refreshToken);
  const [logoutMutation] = useLogoutMutation();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const logout = async () => {
    handleClose();
    router.push("/");
    // ponytail: server revoke best-effort on logout — tokens are cleared locally even if the call fails
    try {
      await logoutMutation(refreshToken).unwrap();
    } catch {
      // offline / expired access token: local clear below is the fallback
    }
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
        <MenuItem
          onClick={() => {
            handleClose();
            router.push("/roommate/profile");
          }}
        >
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

      <ChangePasswordDialog open={changePasswordOpen} onClose={handleChangePasswordClose} />
    </>
  );
}

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

export default function AccountMenu({ anchorEl, open, handleClose }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const logout = () => {
    router.push("/");
    dispatch(removeUserInfo());
  };

  return (
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
      <MenuItem onClick={handleClose}>
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
  );
}

"use client";
import {
  EmailOutlined,
  FavoriteBorderOutlined,
  LockOutlined,
  PersonOutline,
} from "@mui/icons-material";
import {
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";

const groups = [
  {
    title: "Account Management",
    options: [
      { text: "Basic Information", url: "/landlord/edit-info", icon: <PersonOutline /> },
      { text: "Saved Posts", url: "/landlord/favourites", icon: <FavoriteBorderOutlined /> },
      { text: "Notifications", url: "/landlord/notifications", icon: <EmailOutlined /> },
      { text: "Change Password", url: "/landlord/change-password", icon: <LockOutlined /> },
    ],
  },
];

const useIsGroupSelected = (group) => {
  const pathname = usePathname();
  return group.options.some(({ url }) => pathname == url);
};

export default function SideBar() {
  const theme = useTheme();
  const user = useSelector((s) => s.auth.user);
  const pathname = usePathname();

  return (
    <Stack sx={{ height: "calc(100vh - 60px)", minWidth: 280, py: 2, px: 1, boxShadow: theme.shadows[1] }}>
      <List disablePadding>
        <ListItem alignItems="flex-start">
          <ListItemAvatar>
            <Avatar src="/path-to-avatar.jpg" />
          </ListItemAvatar>
          <ListItemText primary={user?.name} secondary={user?.phone} />
        </ListItem>
        <Divider variant="middle" />

        {groups.map((group) => (
          <>
            <ListSubheader>{group.title}</ListSubheader>

            {group.options.map((option) => (
              <ListItemButton key={option.text} component={Link} to={option.url} selected={pathname == option.url}>
                <ListItemIcon>{option.icon}</ListItemIcon>
                <ListItemText primary={option.text} />
              </ListItemButton>
            ))}
            <Divider variant="middle" />
          </>
        ))}
      </List>
    </Stack>
  );
}

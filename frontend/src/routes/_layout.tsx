import { Box, Flex, Spacer } from "@chakra-ui/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Loading...',
      },
    ],
  })
})

function Layout() {
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden" direction={{ base: "column", lg: "row" }} gapY="50">
        <Box float="left" order="1">
          <Spacer />
          <Sidebar />
        </Box>
        <Box order="2" flex="1" overflowY="auto" minH="0">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  )
}

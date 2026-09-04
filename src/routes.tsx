import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ContractReview from "./pages/ContractReview";
import ContractResult from "./pages/ContractResult";
import DocumentGen from "./pages/DocumentGen";
import AIChat from "./pages/AIChat";
import HumanChat from "./pages/HumanChat";
import LawyerChatPage from "./pages/LawyerChatPage";
import LawFirms from "./pages/LawFirms";
import LawFirmDetail from "./pages/LawFirmDetail";
import LawyerDetail from "./pages/LawyerDetail";
import Booking from "./pages/Booking";
import Compliance from "./pages/Compliance";
import DebtCollection from "./pages/DebtCollection";
import Archive from "./pages/Archive";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Messages from "./pages/Messages";
import ConsultationRecords from "./pages/ConsultationRecords";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "discover", Component: Discover },
      { path: "chat", Component: Chat },
      { path: "profile", Component: Profile },
      { path: "contract-review", Component: ContractReview },
      { path: "contract-result", Component: ContractResult },
      { path: "document", Component: DocumentGen },
      { path: "chat/ai", Component: AIChat },
      { path: "chat/human", Component: HumanChat },
      { path: "chat/lawyer", Component: LawyerChatPage },
      { path: "consultations", Component: ConsultationRecords },
      { path: "law-firms", Component: LawFirms },
      { path: "law-firm/:id", Component: LawFirmDetail },
      { path: "lawyer/:id", Component: LawyerDetail },
      { path: "booking/:lawyerId", Component: Booking },
      { path: "compliance", Component: Compliance },
      { path: "debt-collection", Component: DebtCollection },
      { path: "archive", Component: Archive },
      { path: "orders", Component: Orders },
      { path: "order/:id", Component: OrderDetail },
      { path: "messages", Component: Messages },
    ],
  },
]);

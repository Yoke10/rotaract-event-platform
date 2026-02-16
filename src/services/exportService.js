import * as XLSX from 'xlsx';
// import { db } from './firebaseConfig';
// import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, collection, getDocs } from './mockFirebase';

export const exportService = {
    exportToExcel: async (filename = 'export.xlsx') => {
        try {
            // 1. Fetch Events
            const eventsSnap = await getDocs(collection(db, 'events'));
            const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Fetch Tickets (Participants)
            const ticketsSnap = await getDocs(collection(db, 'tickets'));
            const tickets = ticketsSnap.docs.map(d => {
                const data = d.data();
                return {
                    TicketID: data.ticketId,
                    EventName: data.eventName,
                    Name: data.userName,
                    Email: data.userEmail,
                    Club: data.userClub,
                    Status: data.status,
                    UsedCategories: (data.usedCategories || []).join(', '),
                    GeneratedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : ''
                };
            });

            // 3. Create Workbook
            const wb = XLSX.utils.book_new();

            // Sheet 1: Events
            const wsEvents = XLSX.utils.json_to_sheet(events.map(e => ({
                Name: e.name,
                Date: e.date,
                Location: e.location,
                Price: e.ticketPrice,
                Sold: e.ticketsSold,
                Total: e.totalTickets,
                Revenue: (e.ticketsSold || 0) * (e.ticketPrice || 0)
            })));
            XLSX.utils.book_append_sheet(wb, wsEvents, "Events");

            // Sheet 2: Participants
            const wsTickets = XLSX.utils.json_to_sheet(tickets);
            XLSX.utils.book_append_sheet(wb, wsTickets, "Participants & Scans");

            // 4. Save
            XLSX.writeFile(wb, filename);

            return true;
        } catch (error) {
            console.error("Export failed", error);
            return false;
        }
    }
};

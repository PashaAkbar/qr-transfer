import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            SendView()
                .tabItem {
                    Label("Kirim", systemImage: "paperplane.fill")
                }

            ReceiveView()
                .tabItem {
                    Label("Terima", systemImage: "qrcode.viewfinder")
                }
        }
    }
}

#Preview {
    ContentView()
}

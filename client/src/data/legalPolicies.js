export const POLICY_UPDATED_AT = "13/07/2026";

export const legalPolicies = {
    "terms-of-service": {
        title: "Điều khoản sử dụng",
        summary: "Các quy tắc áp dụng khi truy cập, tạo tài khoản và mua sắm trên website DPWOOD.",
        sections: [
            {
                title: "1. Phạm vi áp dụng",
                paragraphs: [
                    "Điều khoản này điều chỉnh việc sử dụng website dpwood.store, tài khoản khách hàng và các chức năng đặt mua sản phẩm của DPWOOD. Khi tiếp tục sử dụng website, khách hàng xác nhận đã đọc và đồng ý với các nội dung dưới đây.",
                    "Nếu không đồng ý với một nội dung, khách hàng nên ngừng thao tác liên quan và liên hệ bộ phận hỗ trợ để được giải thích trước khi đặt hàng.",
                ],
            },
            {
                title: "2. Tài khoản khách hàng",
                bullets: [
                    "Thông tin đăng ký phải chính xác, thuộc quyền sử dụng hợp pháp của người đăng ký.",
                    "Khách hàng tự bảo mật mật khẩu, mã xác minh và thiết bị đăng nhập; không chia sẻ mã OTP hoặc đường dẫn đặt lại mật khẩu.",
                    "DPWOOD có thể tạm khóa tài khoản khi phát hiện đăng nhập bất thường, gian lận, lạm dụng mã giảm giá hoặc hành vi gây ảnh hưởng đến hệ thống.",
                    "Yêu cầu sửa dữ liệu định danh quan trọng có thể cần được xác minh qua bộ phận quản trị.",
                ],
            },
            {
                title: "3. Thông tin sản phẩm và giá bán",
                paragraphs: [
                    "DPWOOD cố gắng thể hiện đúng tên, hình ảnh, chất liệu, kích thước, biến thể, tồn kho và giá bán. Màu sắc thực tế có thể chênh lệch nhẹ do màn hình hoặc điều kiện chụp ảnh.",
                    "Giá thanh toán cuối cùng là giá hiển thị tại bước xác nhận đơn, sau khi áp dụng mã giảm giá hợp lệ và phí phát sinh được công khai. Nếu có lỗi hiển thị rõ ràng, DPWOOD sẽ liên hệ để khách hàng chọn xác nhận lại hoặc hủy đơn.",
                ],
            },
            {
                title: "4. Đặt hàng và xác nhận",
                bullets: [
                    "Đơn hàng chỉ được ghi nhận khi hệ thống cấp mã đơn hàng.",
                    "DPWOOD có thể liên hệ để xác minh người nhận, địa chỉ, số điện thoại, số lượng hoặc biến thể sản phẩm.",
                    "Đơn có dấu hiệu gian lận, thông tin giao hàng không hợp lệ hoặc vượt tồn kho thực tế có thể bị từ chối và được thông báo cho khách hàng.",
                    "Khách hàng có thể hủy đơn đang ở trạng thái cho phép; đơn đã giao cho đơn vị vận chuyển sẽ áp dụng quy trình đổi trả.",
                ],
            },
            {
                title: "5. Hành vi không được phép",
                bullets: [
                    "Can thiệp trái phép vào website, API, database hoặc cơ chế bảo mật.",
                    "Sử dụng bot để tạo đơn, thu thập dữ liệu, chiếm mã giảm giá hoặc gây quá tải hệ thống.",
                    "Đăng nội dung đánh giá sai sự thật, xúc phạm, vi phạm pháp luật hoặc xâm phạm quyền của người khác.",
                    "Mạo danh khách hàng, nhân viên DPWOOD hoặc sử dụng phương thức thanh toán không thuộc quyền quản lý hợp pháp.",
                ],
            },
            {
                title: "6. Quyền sở hữu nội dung",
                paragraphs: [
                    "Tên DPWOOD, giao diện, bài viết, hình ảnh do DPWOOD tự sản xuất và dữ liệu trình bày trên website được bảo vệ theo quy định liên quan. Khách hàng không được sao chép để kinh doanh hoặc phát hành lại khi chưa có chấp thuận.",
                    "Đánh giá do khách hàng gửi vẫn thuộc trách nhiệm của người gửi; khách hàng đồng ý cho DPWOOD hiển thị đánh giá đó trong phạm vi vận hành website.",
                ],
            },
            {
                title: "7. Thay đổi điều khoản và liên hệ",
                paragraphs: [
                    "DPWOOD có thể cập nhật điều khoản để phản ánh thay đổi của dịch vụ hoặc quy định pháp luật. Phiên bản mới được công bố tại trang này cùng ngày cập nhật.",
                    "Mọi câu hỏi hoặc khiếu nại có thể gửi tại Trung tâm hỗ trợ hoặc tới địa chỉ 128 Hàng Trống, Hoàn Kiếm, Hà Nội.",
                ],
            },
        ],
    },
    "privacy-policy": {
        title: "Chính sách bảo mật",
        summary: "Cách DPWOOD thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của khách hàng.",
        sections: [
            {
                title: "1. Dữ liệu được thu thập",
                bullets: [
                    "Thông tin tài khoản: họ tên, email, tên đăng nhập, số điện thoại và ảnh đại diện.",
                    "Thông tin giao hàng: người nhận, số điện thoại, địa chỉ và ghi chú cần thiết cho việc giao hàng.",
                    "Dữ liệu giao dịch: mã đơn, sản phẩm, số lượng, giá, mã giảm giá, phương thức và trạng thái thanh toán.",
                    "Dữ liệu kỹ thuật và bảo mật: thời điểm đăng nhập, trạng thái tài khoản, địa chỉ IP hoặc thông tin thiết bị khi cần bảo vệ hệ thống.",
                    "Nội dung do khách hàng chủ động gửi như đánh giá sản phẩm và yêu cầu hỗ trợ.",
                ],
            },
            {
                title: "2. Mục đích sử dụng",
                bullets: [
                    "Tạo và quản lý tài khoản; xác minh email; hỗ trợ khôi phục mật khẩu.",
                    "Xử lý đơn hàng, thanh toán, giao nhận, đổi trả và chăm sóc sau bán.",
                    "Phát hiện hành vi gian lận, truy cập trái phép và bảo vệ an toàn cho khách hàng.",
                    "Cải thiện tìm kiếm, đề xuất sản phẩm và chất lượng vận hành của website.",
                    "Gửi thông báo dịch vụ hoặc ưu đãi khi phù hợp với lựa chọn của khách hàng.",
                ],
            },
            {
                title: "3. Cookie và lưu trữ trên trình duyệt",
                paragraphs: [
                    "Website có thể dùng cookie hoặc local storage để duy trì phiên đăng nhập, giỏ hàng, mã giảm giá đã lưu và tùy chọn giao diện. Việc tắt hoàn toàn các cơ chế này có thể khiến một số chức năng không hoạt động.",
                ],
            },
            {
                title: "4. Chia sẻ dữ liệu",
                paragraphs: [
                    "DPWOOD chỉ chia sẻ dữ liệu cần thiết với đơn vị xử lý thanh toán, vận chuyển, email, lưu trữ hình ảnh hoặc hạ tầng kỹ thuật để hoàn thành dịch vụ. Các đơn vị này chỉ nhận phạm vi dữ liệu phù hợp với nhiệm vụ của họ.",
                    "Dữ liệu có thể được cung cấp cho cơ quan có thẩm quyền khi có yêu cầu hợp pháp. DPWOOD không bán dữ liệu cá nhân của khách hàng.",
                ],
            },
            {
                title: "5. Thời gian lưu trữ",
                paragraphs: [
                    "Thông tin tài khoản và đơn hàng được lưu trong thời gian cần thiết để cung cấp dịch vụ, giải quyết khiếu nại và đáp ứng nghĩa vụ lưu trữ. Nhật ký đăng nhập thông thường được giới hạn theo chính sách vận hành; dữ liệu hết mục đích sẽ được xóa hoặc ẩn danh khi phù hợp.",
                ],
            },
            {
                title: "6. Quyền của khách hàng",
                bullets: [
                    "Xem và cập nhật thông tin hồ sơ trong phạm vi website cho phép.",
                    "Yêu cầu kiểm tra, điều chỉnh hoặc xóa dữ liệu không còn cần thiết, trừ dữ liệu phải lưu theo nghĩa vụ giao dịch.",
                    "Yêu cầu khóa tài khoản hoặc phản ánh việc sử dụng dữ liệu không đúng mục đích.",
                    "Liên hệ DPWOOD để được giải thích về dữ liệu đang được xử lý.",
                ],
            },
            {
                title: "7. An toàn dữ liệu",
                paragraphs: [
                    "DPWOOD áp dụng kiểm soát truy cập theo vai trò, mã hóa đường truyền, giới hạn đăng nhập và lưu nhật ký cần thiết. Không hệ thống trực tuyến nào loại bỏ hoàn toàn rủi ro; khách hàng nên dùng mật khẩu riêng và thông báo ngay khi nghi ngờ tài khoản bị truy cập trái phép.",
                ],
            },
        ],
    },
    "shipping-policy": {
        title: "Chính sách giao hàng",
        summary: "Quy trình xác nhận, đóng gói, giao nhận và xử lý tình huống phát sinh với đơn hàng DPWOOD.",
        sections: [
            {
                title: "1. Phạm vi giao hàng",
                paragraphs: [
                    "DPWOOD tiếp nhận địa chỉ giao hàng hợp lệ tại Việt Nam trong phạm vi được đơn vị vận chuyển hỗ trợ. Khả năng giao đến khu vực đảo, vùng xa hoặc địa chỉ hạn chế tiếp cận sẽ được xác nhận riêng.",
                ],
            },
            {
                title: "2. Xử lý và đóng gói",
                bullets: [
                    "Đơn được kiểm tra tồn kho và thông tin người nhận trước khi bàn giao.",
                    "Sản phẩm dễ vỡ hoặc có bề mặt gỗ được đóng gói phù hợp với đặc tính hàng hóa.",
                    "Đơn có nhiều sản phẩm có thể được tách thành nhiều kiện nhưng vẫn gắn với cùng mã đơn hàng.",
                ],
            },
            {
                title: "3. Thời gian dự kiến",
                paragraphs: [
                    "Thời gian giao phụ thuộc địa chỉ, thời điểm xác nhận và năng lực của đơn vị vận chuyển. Thời gian dự kiến được tính từ khi đơn chuyển sang trạng thái xử lý hoặc đã thanh toán, không bao gồm sự kiện bất khả kháng, ngày lễ hoặc yêu cầu thay đổi thông tin từ khách hàng.",
                    "DPWOOD sẽ cập nhật trạng thái trong hồ sơ đơn hàng. Đây là thời gian dự kiến, không phải cam kết tuyệt đối về một thời điểm cụ thể.",
                ],
            },
            {
                title: "4. Phí giao hàng",
                paragraphs: [
                    "Phí giao hàng, nếu có, phải được hiển thị hoặc thông báo trước khi khách hàng xác nhận thanh toán. Chương trình miễn phí vận chuyển chỉ áp dụng khi đơn đáp ứng đầy đủ điều kiện của ưu đãi tại thời điểm đặt hàng.",
                ],
            },
            {
                title: "5. Kiểm tra khi nhận hàng",
                bullets: [
                    "Đối chiếu tên người nhận, mã đơn, số kiện và tình trạng bao bì.",
                    "Quay ảnh hoặc video khi phát hiện kiện móp, ướt, rách, thiếu sản phẩm hoặc sản phẩm hư hỏng.",
                    "Thông báo sớm qua Trung tâm hỗ trợ, kèm mã đơn và bằng chứng để DPWOOD xử lý với đơn vị vận chuyển.",
                ],
            },
            {
                title: "6. Giao hàng không thành công",
                paragraphs: [
                    "Nếu không liên hệ được người nhận hoặc địa chỉ không chính xác, đơn vị vận chuyển có thể hẹn giao lại hoặc hoàn hàng. Chi phí phát sinh do thông tin khách hàng cung cấp sai có thể được thông báo trước khi giao lại.",
                ],
            },
            {
                title: "7. Chậm trễ hoặc thất lạc",
                paragraphs: [
                    "Khi đơn chậm bất thường, DPWOOD sẽ phối hợp tra soát theo mã vận chuyển. Trường hợp được xác nhận thất lạc, khách hàng được đề xuất giao lại sản phẩm tương đương hoặc hoàn khoản đã thanh toán theo chính sách thanh toán.",
                ],
            },
        ],
    },
    "returns-refunds": {
        title: "Chính sách đổi trả và hoàn tiền",
        summary: "Điều kiện và quy trình yêu cầu đổi trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng.",
        sections: [
            {
                title: "1. Thời hạn gửi yêu cầu",
                paragraphs: [
                    "Khách hàng nên gửi yêu cầu trong vòng 7 ngày kể từ thời điểm đơn được xác nhận giao thành công. Mã đơn hàng, sản phẩm cần xử lý và lý do đổi trả phải được cung cấp đầy đủ.",
                ],
            },
            {
                title: "2. Trường hợp được hỗ trợ",
                bullets: [
                    "Sản phẩm giao sai mẫu, màu, kích thước hoặc số lượng so với đơn đã xác nhận.",
                    "Sản phẩm bị vỡ, nứt, biến dạng hoặc mất khả năng sử dụng do quá trình vận chuyển.",
                    "Sản phẩm có lỗi kỹ thuật hoặc lỗi sản xuất được phát hiện khi sử dụng đúng hướng dẫn.",
                    "Sản phẩm còn nguyên trạng và đáp ứng điều kiện đổi trả được DPWOOD xác nhận.",
                ],
            },
            {
                title: "3. Điều kiện sản phẩm",
                bullets: [
                    "Có thông tin đơn hàng hợp lệ và bằng chứng tình trạng sản phẩm khi cần.",
                    "Còn đầy đủ phụ kiện, quà tặng, hướng dẫn và bao bì có thể thu hồi.",
                    "Không có dấu hiệu sử dụng sai hướng dẫn, tự sửa chữa, va đập hoặc bảo quản không phù hợp.",
                    "Sản phẩm tiếp xúc trực tiếp với thực phẩm cần được làm sạch và đóng gói an toàn trước khi gửi trả.",
                ],
            },
            {
                title: "4. Trường hợp hạn chế đổi trả",
                paragraphs: [
                    "DPWOOD có thể từ chối sản phẩm đã sử dụng quá mức cần thiết để kiểm tra, bị thiếu bộ phận, hư hỏng do khách hàng hoặc thuộc chương trình thanh lý có công bố điều kiện riêng. Quyền lợi bảo hành hợp lệ vẫn được xem xét độc lập.",
                ],
            },
            {
                title: "5. Quy trình thực hiện",
                bullets: [
                    "Gửi ticket tại Trung tâm hỗ trợ, chọn chủ đề sản phẩm hoặc đơn hàng.",
                    "Cung cấp mã đơn, mô tả lỗi và hình ảnh/video liên quan.",
                    "Chờ DPWOOD xác nhận phương án, địa chỉ nhận hàng và cách đóng gói.",
                    "Không tự gửi hàng khi chưa có hướng dẫn vì kiện hàng có thể không được đối soát.",
                ],
            },
            {
                title: "6. Chi phí vận chuyển đổi trả",
                paragraphs: [
                    "DPWOOD chịu chi phí hợp lý khi lỗi thuộc về sản phẩm, đóng gói hoặc giao sai. Với yêu cầu đổi theo nhu cầu cá nhân và sản phẩm đủ điều kiện, chi phí vận chuyển hai chiều có thể do khách hàng chi trả sau khi được thông báo.",
                ],
            },
            {
                title: "7. Hoàn tiền",
                paragraphs: [
                    "Sau khi hàng trả được kiểm tra và yêu cầu được chấp nhận, khoản hoàn được xử lý về phương thức phù hợp. Thời gian tiền về phụ thuộc ngân hàng hoặc đối tác thanh toán; DPWOOD sẽ cung cấp trạng thái xử lý để khách hàng theo dõi.",
                ],
            },
        ],
    },
    "payment-policy": {
        title: "Chính sách thanh toán",
        summary: "Các phương thức thanh toán, cách xác nhận giao dịch và nguyên tắc bảo vệ khách hàng.",
        sections: [
            {
                title: "1. Phương thức được hỗ trợ",
                bullets: [
                    "Thanh toán khi nhận hàng (COD) đối với đơn và khu vực đủ điều kiện.",
                    "Chuyển khoản qua mã QR PayOS được tạo riêng cho từng đơn hàng.",
                    "Mã giảm giá đã lưu trong kho mã có thể được áp dụng khi đáp ứng điều kiện sử dụng.",
                ],
            },
            {
                title: "2. Xác nhận số tiền",
                paragraphs: [
                    "Khách hàng cần kiểm tra sản phẩm, số lượng, biến thể, địa chỉ, mã giảm giá và tổng thanh toán trước khi xác nhận. Với PayOS, chỉ chuyển đúng số tiền và nội dung hiển thị trên mã QR của đơn đang thanh toán.",
                ],
            },
            {
                title: "3. Xác nhận thanh toán PayOS",
                paragraphs: [
                    "Hệ thống nhận trạng thái giao dịch từ PayOS và tự động cập nhật đơn khi khoản tiền được xác nhận. Không gửi ảnh chuyển khoản thay cho việc đối soát tự động, trừ khi bộ phận hỗ trợ yêu cầu để tra soát.",
                    "Nếu ngân hàng đã trừ tiền nhưng đơn chưa cập nhật, khách hàng không nên thanh toán lần hai. Hãy gửi mã đơn và mã tham chiếu giao dịch tại Trung tâm hỗ trợ.",
                ],
            },
            {
                title: "4. Thanh toán COD",
                paragraphs: [
                    "Khách hàng thanh toán số tiền được đơn vị giao hàng thông báo và nên yêu cầu đối chiếu mã đơn trước khi trả tiền. Các yêu cầu chuyển khoản vào tài khoản cá nhân không xuất hiện trong quy trình DPWOOD cần được từ chối và báo lại ngay.",
                ],
            },
            {
                title: "5. Giao dịch thất bại hoặc trùng lặp",
                bullets: [
                    "Giao dịch thất bại không làm đơn chuyển sang trạng thái đã thanh toán.",
                    "Giao dịch trùng cần được tra soát theo mã đơn, số tiền, thời gian và mã tham chiếu ngân hàng.",
                    "DPWOOD chỉ xác nhận kết quả sau khi dữ liệu từ đối tác thanh toán hoặc tài khoản nhận tiền được đối soát.",
                ],
            },
            {
                title: "6. An toàn thanh toán",
                bullets: [
                    "DPWOOD không yêu cầu khách hàng cung cấp mật khẩu ngân hàng, mã OTP hoặc mã PIN.",
                    "Không quét mã QR được gửi từ tài khoản không xác định hoặc khác mã hiển thị trong đơn.",
                    "Đăng xuất khỏi thiết bị dùng chung và báo ngay khi phát hiện giao dịch đáng ngờ.",
                ],
            },
            {
                title: "7. Hoàn tiền và khiếu nại",
                paragraphs: [
                    "Khoản hoàn chỉ được thực hiện sau khi yêu cầu hủy, đổi trả hoặc giao dịch lỗi được xác nhận. Thời gian hoàn tất phụ thuộc phương thức nhận tiền và quy trình của ngân hàng. Khiếu nại liên quan đến tiền được chuyển cho quản trị viên xử lý, không giao cho chatbot tự quyết định.",
                ],
            },
        ],
    },
};

export const policyLinks = Object.entries(legalPolicies).map(([slug, policy]) => ({
    slug,
    href: `/policies/${slug}`,
    title: policy.title,
}));

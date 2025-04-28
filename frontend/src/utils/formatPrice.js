const formatVietnamesePrice = (price) => {
  if (price < 1000000) {
    const number = price.toLocaleString("vi-VN");
    return { number, text: number + " đồng" };
  }

  // Calculate the price in millions
  const priceInMillions = price / 1000000;
  const number = priceInMillions.toLocaleString("vi-VN");

  // Convert number to Vietnamese text format
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const numberToWords = (num) => {
    if (num === 0) return "không";
    let words = "";
    let unitIndex = 0;
    while (num > 0) {
      const chunk = Math.floor(num % 1000);
      if (chunk > 0) {
        const chunkText = convertChunkToText(chunk, unitIndex > 0);
        words = chunkText + " " + units[unitIndex] + " " + words;
      }
      num = Math.floor(num / 1000);
      unitIndex++;
    }
    return words.trim() + " triệu đồng";
  };

  const convertChunkToText = (chunk, includeZeroHundred) => {
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const teens = [
      "mười",
      "mười một",
      "mười hai",
      "mười ba",
      "mười bốn",
      "mười lăm",
      "mười sáu",
      "mười bảy",
      "mười tám",
      "mười chín",
    ];
    const tens = [
      "",
      "mười",
      "hai mươi",
      "ba mươi",
      "bốn mươi",
      "năm mươi",
      "sáu mươi",
      "bảy mươi",
      "tám mươi",
      "chín mươi",
    ];

    let str = "";
    if (chunk >= 100) {
      str += units[Math.floor(chunk / 100)] + " trăm ";
      chunk %= 100;
    } else if (includeZeroHundred && chunk > 0) {
      str += "không trăm ";
    }
    if (chunk >= 20) {
      str += tens[Math.floor(chunk / 10)] + " ";
      chunk %= 10;
    } else if (chunk >= 10) {
      str += teens[chunk - 10] + " ";
      chunk = 0;
    }
    if (chunk > 0) {
      if (str !== "" && chunk < 10 && str.trim().slice(-1) !== "mười") {
        str += "lẻ ";
      }
      str += units[chunk] + " ";
    }
    return str.trim();
  };

  const text = numberToWords(priceInMillions);

  return { number, text };
};

// Example usage
// const price = 303430000;
// const formattedPrice = formatVietnamesePrice(price);
// console.log(formattedPrice); // {number: "1,000,000", text: "một triệu đồng"}
export default formatVietnamesePrice;

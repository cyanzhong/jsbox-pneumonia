const constants = require("./constants");
const helper = require("./helper");

const {
  api,
  isTodayWidget,
  secondaryTextColor,
} = constants;

let galleryView = null;
let mapImageView = null;
let chartImageView = null;

const views = [
  {
    type: "label",
    props: {
      id: "ts-label",
      textColor: secondaryTextColor,
      font: $font(13),
      align: $align.center
    },
    layout: (make, view) => {
      make.centerX.equalTo(view.super);
      make.top.equalTo(0);
      make.height.equalTo(20);
    }
  }
];

if (!isTodayWidget) {
  views.push({
    type: "view",
    layout: (make, view) => {
      make.left.right.equalTo(0);
      make.top.equalTo(20);
      make.height.equalTo(240);
    },
    views: [
      {
        type: "gallery",
        props: {
          onColor: $color("#157efb"),
          offColor: $color("#cccccc"),
          items: [
            {
              type: "image",
              props: {
                bgcolor: $color("#f3f3f3"),
                src: $cache.get("map-image-data"),
                contentMode: $contentMode.scaleAspectFit
              },
              events: {
                ready: sender => {
                  mapImageView = sender;
                },
                tapped: helper.openImage
              }
            },
            {
              type: "image",
              props: {
                src: $cache.get("chart-image-data"),
                contentMode: $contentMode.scaleAspectFit
              },
              events: {
                ready: sender => {
                  chartImageView = sender;
                },
                tapped: helper.openImage
              }
            }
          ]
        },
        layout: $layout.fill,
        events: {
          ready: sender => {
            galleryView = sender;
          }
        }
      },
      {
        type: "web",
        props: {
          id: "hidden-webview",
          url: api,
          hidden: true
        },
        layout: $layout.fill,
        events: {
          didFinish: webViewDidFinish
        }
      },
      {
        type: "button",
        props: {
          symbol: "arrow.up.left.and.arrow.down.right",
          bgcolor: $color("clear")
        },
        layout: (make, view) => {
          make.left.top.equalTo(5);
        },
        events: {
          tapped: enlargeButtonTapped
        }
      }
    ]
  });
}

views.push({
  type: "label",
  props: {
    id: "summary-label",
    textColor: secondaryTextColor,
    font: $font(13),
    align: $align.center
  },
  layout: (make, view) => {
    make.left.right.inset(15);
    make.bottom.equalTo(0);
    make.height.equalTo(20);
  }
});

exports.view = (() => {
  return {
    type: "view",
    props: {
      height: isTodayWidget ? 36 : 280
    },
    views: views
  };
})();

exports.setChartViewURL = src => {
  if (chartImageView && src) {
    chartImageView.src = src;
  }
}

function webViewDidFinish(sender) {
  const timer = setInterval(async() => {
    const script =
    `
    (() => {
      const mapImage = document.querySelector("div[class^='mapImg'] > img");
      const chartImage = document.querySelector("img[class^='mapImg']");
      const statistics = document.querySelector("div[class^='statistics'] > div[class^='title'] > span");
      if (chartImage && statistics) {
        return {
          mapDataURL: mapImage.src,
          chartDataURL: chartImage.src,
          statsText: statistics.innerText,
        };
      } else {
        return null;
      }
    })();
    `;
    const results = (await sender.eval(script))[0];
    if (results) {
      timer.invalidate();
      mapImageView.src = results.mapDataURL;
      chartImageView.src = results.chartDataURL;
      $("ts-label").text = results.statsText;
      $cache.set("map-image-data", results.mapDataURL);
      $cache.set("chart-image-data", results.chartDataURL);
    }
  }, 200);
}

function enlargeButtonTapped() {
  const index = galleryView.index;
  const imageView = index === 0 ? mapImageView : chartImageView;
  helper.openImage(imageView);
}
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	exchangesdk "github.com/exchange-saas/exchange-sdk/sdk/go"
)

func main() {
	apiKey := os.Getenv("EXCHANGE_API_KEY")
	if apiKey == "" {
		apiKey = "sk_live_your_api_key"
	}

	client, err := exchangesdk.NewClient(exchangesdk.Config{
		APIKey:     apiKey,
		BaseURL:    "https://api.l.lc/exchange",
		Lang:       exchangesdk.LangEN,
		ClientHost: "https://yourdomain.com",
		Timeout:    8 * time.Second,
	})
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	res, err := client.Convert(ctx, "USD", "VND", 100)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Result:", res["result"], "Message:", res["message"])
}

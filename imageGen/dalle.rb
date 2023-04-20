require "openai"

require 'open-uri'

client = OpenAI::Client.new(access_token: "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")


  # Create the image prompt by appending the breed name to "a realistic photo of a smiling"
  prompt = "a line icon of a smiling chat bubble with the color and texture of a lemon and lemon leaves coming out of its head"


  # Use OpenAI API to generate an image based on the prompt
  response = client.images.generate(parameters: {prompt: prompt, size: '1024x1024'})
puts response
  # Get the URL of the generated image
  image_url = response['data'][0]['url']

# Download the image and save it to the imagesFeatured folder
  filename = "icon1.jpg"
  File.open("#{filename}", 'wb') do |file|
    file.write open(image_url).read
  end
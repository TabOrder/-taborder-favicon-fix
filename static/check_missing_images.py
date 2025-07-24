import os

# List of expected image names from the frontend mapping
expected_images = [
    'sunlight-powder.jpg',
    'milk.jpg',
    'handy-andy.jpg',
    'toilet-paper.jpg',
    'maize-meal.jpg',
    'rice.jpg',
    'pap.jpg',
    'diapers.jpg',
    'wipes.jpg',
    'purity.jpg',
    'bleach.jpg',
    'coke.jpg',
    'tea.jpg',
    'soap.jpg',
    'toothpaste.jpg',
]

image_dir = os.path.join(os.path.dirname(__file__), 'placeholders')

missing = []
for img in expected_images:
    if not os.path.isfile(os.path.join(image_dir, img)):
        missing.append(img)

if missing:
    print('Missing images:')
    for img in missing:
        print(' -', img)
else:
    print('All expected images are present.') 
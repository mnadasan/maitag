import formidable from 'formidable-serverless';
import fs from 'fs';
import rekognition from "@/aws-services";
import {FaceDetailList} from "aws-sdk/clients/rekognition";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(req, res) {
	// 1. check if method is a POST call
	if (req.method === 'POST') {
		try {
			// 2. parse the form
			const form = new formidable.IncomingForm();
			form.parse(req, async (err, fields, files) => {
				if (err) {
					console.error('Error parsing form:', err);
					return res.status(500).json({error: 'Error parsing form'});
				}

				// 3. read the image file and assign the buffer to variable image
				const image = fs.readFileSync(files.file.path);
				const params = {
					Image: {
						Bytes: image,  // buffer
					},
					MaxLabels: 10, // Maximum number of labels to return
					MinConfidence: 50, // Minimum confidence level for the detected labels
				};
				const faceParams = {
					Image: {
						Bytes: image,  // buffer
					},
					Attributes: ["ALL", "DEFAULT"]
				}
				const celebrityParams = {
					Image: {
						Bytes: image,  // buffer
					}
				}
				try {
					// 4. call the rekognition api to get the detected labels
					const labelsResponse = await rekognition.detectLabels(celebrityParams).promise();
					const faceResponse = await rekognition.detectFaces(faceParams).promise();
					const celebrityResponse = await rekognition.recognizeCelebrities(celebrityParams).promise();
					// 5. return the labels

					return res.status(200).json(
						{
							labels:labelsResponse.Labels,
							face:faceResponse.FaceDetails,
							celebrityResponse: celebrityResponse.CelebrityFaces
						});
					// return res.status(200).json(
					// 	{
					// 		labels: celebrityResponse.CelebrityFaces
					// 	});
				} catch (error) {
					console.error('Error detecting labels:', error.message);
					// 6. error detecting labels - like invalid file etc
					return res.status(500).json({message: error.message});
				}
			});
		} catch (error) {
			console.error('Error:', error.message);
			res.status(500).json({message: error.message});
		}
	} else {
		// 7. method not allowed
		res.status(405).json({error: 'Method not allowed'});
	}
}
